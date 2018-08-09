import re
from IPython.utils.io import capture_output
import time
from threading import Thread

class GangaMonitor:
    """
    Main singleton object for running Ganga as Python API.
    This is the mail class for kernel extension which handles actual submission of Jobs,
    sends it info and status to frontend. Jobs are not monitored in kernel but monitored in 
    server extension.

    This class registers a Comm connection using Jupyter Comm API, which communicates with 
    frontend nbextension (gangamonitor.js) and using this connection it sends all the Jobs info and status.
    """
    def __init__(self, ipython):
        self.ipython = ipython
        self.cell = None
        # Import Ganga Module in Kernel namespace
        self.ipython.run_code("import ganga.ganga")
        # Disable stomp library : Refer to https://github.com/apsknight/gangaextension/issues/8
        self.ipython.run_code("ganga.config.Configuration.UsageMonitoringMSG = False")
        # Import default Ganga Namespace in Kernel Namespace
        self.ipython.run_code("from ganga import *")
        # Disable Monitoring as Jobs won't be monitored here.
        self.ipython.run_code("disableMonitoring()")
        # List of active Jobs which needs to be tracked and status to be sent to nbextension
        self.active_jobs = list()
        # Endpoints on which a Job finishes
        self.endpoints = ["completed", "killed", "failed"]
        # Create and start an unified thread to send status of all active Jobs to frontend.
        status_thread = Thread(target=self.job_status_tracker, args=())
        status_thread.start()

    def __handle_incoming_msg(self, msg):
        '''
        Handle incoming messages from nbextension (Gangamonitor.js)
        '''
        # print("Message recieved from frontend: \n %s \n" % str(msg))
        data = msg["content"]["data"]
        
        # If resubmission is requested, resubmit job and append it to active jobs list.
        if data["msgtype"] == "resubmit":
            id = int(data["id"])
            self.ipython.run_code("jobs[%s].resubmit()" % id)
            self.send_job_info(int(data["id"]), data["cell"])
            self.active_jobs.append(tuple((int(data["id"]), data["cell"])))

        # If cellinfo is recieved, store it. This is the cell id of the cell from which
        # current process was started, self.cell get overwritten whenever a new job submits.
        if data["msgtype"] == "cellinfo":
            self.cell = data["cell_id"]

    def register_comm(self):
        # This method is used for registering comm in kernel.
        self.ipython.kernel.comm_manager.register_target("GangaMonitor", self.comm_target)
    
    def comm_target(self, comm, msg):
        # print("Comm Opened: \n %s \n" % str(msg))
        self.comm = comm

        @self.comm.on_msg
        def _recv(msg):
            self.__handle_incoming_msg(msg)

        # Send commopen message
        self.comm.send({"msgtype": "commopen"})

    def send(self, msg):
        # Send message to frontend using Comm
        self.comm.send(msg)

    def extract_job_obj(self, code):
        """
        Extract the job object from cell magic code.
        For Ex. if code is:
        > j = Job()
        > # j2 = Job()
        > # j2.submit()
        > j.submit()
        This method will return 'j'.
        """

        # Remove comments from code
        code = re.sub(r'(?m)^ *#.*\n?', '', code)

        regex = r"(\w+)\s*=\s*Job\("
        matches = re.finditer(regex, code, re.MULTILINE)
        
        obj_name = ""

        matchCount = 0
        for match in matches:
            obj_name = match.group(1)
            matchCount = matchCount + 1
        
        if matchCount > 1:
            # This is a design decision that only one Job can be defined per cell.
            self.ipython.run_code('raise Exception("Only one Ganga Job can be defined in a single cell magic.")')
            return False

        if obj_name == "":
            self.ipython.run_code('raise Exception("No Ganga Job is defined in cell magic.")')
            return False

        return str(obj_name)

    def send_job_info(self, id, cell_id):
        """
        Send informtion related to Job to frontend.
        """
        self.ipython.run_code('job_obj = jobs[%s]' % id)
        job_obj = self.ipython.user_ns['job_obj']
        job_info = {
                "msgtype": "jobinfo",
                "id": job_obj.id,
                "cell_id": cell_id,
                "name": str(job_obj.name),
                "backend": str(job_obj.backend.__class__.__name__),
                "subjobs": len(job_obj.subjobs),
                "status": job_obj.status,
                "job_submission_time": str(job_obj.time.submitting())[:19],
                "application": str(job_obj.application).split()[0],
                "splitter": str(job_obj.splitter).split()[0],            
            }
        if job_info["subjobs"] > 0:
            job_info.update({"subjob_submission_time": {}})
            for sj in job_obj.subjobs:
                job_info["subjob_submission_time"][str(sj.id)] = str(sj.time.submitting())[:19]
            
        self.send(job_info)

    def fetch_job_status(self, id, cell_id):
        """
        Fetch current status of job with id `id` from kernel.
        Note: Only load status of Jobs which are in submitted or running stage from disk,
              loading status of new jobs from disk will result in overwriting of Job object by
              the default data present in disk. This is not the case in submitted state as the disk
              is flushed with latest data.
        """
        self.ipython.run_code('job_obj = jobs[%s]' % id)
        job_obj = self.ipython.user_ns['job_obj']

        if str(job_obj.status) == "new" or str(job_obj.status) == "submitting":
            job_status = {
                "msgtype": "jobstatus",
                "id": job_obj.id,
                "cell_id": cell_id,
                "status": str(job_obj.status),
            }
            return job_status

        if str(job_obj.status) == "submitted" or str(job_obj.status) == "running":
            # This method `reloadJob` seems not to update the status of subjobs. This needs a Ganga Fix
            # Until then use Job data as Subjob data.
            self.ipython.run_code('reloadJob(%s)' % id)
            self.ipython.run_code('job_obj = jobs[%s]' % id)
            job_obj = self.ipython.user_ns['job_obj']
                        
        job_status = {
            "msgtype": "jobstatus",
            "id": job_obj.id,
            "cell_id": cell_id,
            "status": str(job_obj.status),
            "job_submission_time": str(job_obj.time.submitting())[:19],
        }

        if len(job_obj.subjobs) > 0:
            job_status.update({"subjob_status": {}})
            job_status.update({"subjob_runtime": {}})
            for sj in job_obj.subjobs:
                job_status["subjob_status"][str(sj.id)] = str(sj.status)
            #     if (str(sj.status) == "completed"):
            #         job_status["subjob_runtime"][str(sj.id)] = str(sj.time.runtime())

        if (job_status["status"] == "completed"):
            job_status.update({"runtime": str(job_obj.time.runtime())})
            for sj in job_obj.subjobs:
                job_status["subjob_status"][str(sj.id)] = job_status["status"]
                # if (str(sj.status) == "completed"):
                job_status["subjob_runtime"][str(sj.id)] = job_status["runtime"]

        return job_status

    def send_status(self):
        # Send status of all active Jobs to frontend
        completed_jobs = list()
        for jobid, cellid in self.active_jobs:
            status = self.fetch_job_status(jobid, cellid)
            # If Job is completed remove it from active jobs.
            if status["status"] in self.endpoints:
                completed_jobs.append(tuple((jobid, cellid)))
            self.send(status)

        new_active_jobs = list()
        for job_tuple in self.active_jobs:
            if job_tuple not in completed_jobs:
                new_active_jobs.append(job_tuple)

        self.active_jobs = new_active_jobs
                
    def job_status_tracker(self):
        # Periodically send status of active Jobs to frontend.
        while True:
            self.send_status()
            time.sleep(15)

    def run(self, raw_cell):
        """
        Submit job in kernel, send info and start monitoring thread.
        """
        job_obj_name = self.extract_job_obj(raw_cell)
        if not job_obj_name:
            return
        try:
            with capture_output() as ganga_job_output:
                self.ipython.run_code(raw_cell)
        except Exception as e:
            self.ipython.run_code("print('GangaMonitor: %s')"  % str(e))
            # print("GangaMonitor: %s" % str(e))
        else:
            jobid = self.ipython.user_ns[job_obj_name].id
            self.send_job_info(jobid, self.cell)
            # Append this Job to active jobs.
            self.active_jobs.append(tuple((jobid, self.cell)))
            return [ganga_job_output]
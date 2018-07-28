from __future__ import print_function
import re
from IPython.utils.io import capture_output
import time
from threading import Thread

class GangaMonitor:
    """
    Main singleton object for running Ganga as Python API.
    """
    def __init__(self, ipython):
        self.ipython = ipython
        self.cell = None
        self.ipython.run_code("import ganga.ganga")
        self.ipython.run_code("from ganga import *")
        self.ipython.run_code("disableMonitoring()")

    def __handle_incoming_msg(self, msg):
        print("Message recieved from frontend: \n %s \n" % str(msg))

        data = msg["content"]["data"]

        # if data["msgtype"] == "askinfo":
        #     self.send_job_info(int(data["id"]), data["cell"])
        
        # If resubmission is requested, resubmit job and start monitoring thread.
        if data["msgtype"] == "resubmit":
            id = int(data["id"])
            self.ipython.run_code("jobs[%s].resubmit()" % id)
            self.send_job_info(int(data["id"]), data["cell"])
            self.send_job_status(int(data["id"]), data["cell"])

        # If cellinfo is recieved, store it.
        if data["msgtype"] == "cellinfo":
            self.cell = data["cell_id"]

    def register_comm(self):
        # This method is used for registering comm
        self.ipython.kernel.comm_manager.register_target("GangaMonitor", self.comm_target)
    
    def comm_target(self, comm, msg):
        print("Comm Opened: \n %s \n" % str(msg))
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
        for match in matches:
            obj_name = match.group(1)
        
        if obj_name == "":
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

    def send_job_status(self, id, cell_id):
        """
        Send status of job to frontend
        """
        self.ipython.run_code('job_obj = jobs[%s]' % id)
        job_obj = self.ipython.user_ns['job_obj']

        endpoints = ["completed", "killed", "failed"]

        while True:
            # Run infinite loop until endpoint is reached
            self.ipython.run_code('reloadJob(%s)' % id)
            self.ipython.run_code('job_obj = jobs[%s]' % id)
            job_obj = self.ipython.user_ns['job_obj']
            job_status = {
                "msgtype": "jobstatus",
                "id": job_obj.id,
                "cell_id": cell_id,
                "status": str(job_obj.status),
            }

            if len(job_obj.subjobs) > 0:
                job_status.update({"subjob_status": {}})
                job_status.update({"subjob_runtime": {}})
                for sj in job_obj.subjobs:
                    job_status["subjob_status"][str(sj.id)] = str(sj.status)
                    if (str(sj.status) == "completed"):
                        job_status["subjob_runtime"][str(sj.id)] = str(sj.time.runtime())

            if (job_status["status"] == "completed"):
                job_status.update({"runtime": str(job_obj.time.runtime())})
                for sj in job_obj.subjobs:
                    job_status["subjob_status"][str(sj.id)] = job_obj["status"]
                    if (str(sj.status) == "completed"):
                        job_status["subjob_runtime"][str(sj.id)] = str(job_obj.time.runtime())


            # Send Job status to frontend every 3 seconds
            time.sleep(3)

            self.send(job_status)

            # If endpoint is reached then break the loop.
            if (job_status["status"] in endpoints):
                break

    def run(self, raw_cell):
        """
        Submit job in kernel, send info and start monitoring thread.
        """
        job_obj_name = self.extract_job_obj(raw_cell)
        if not job_obj_name:
            self.ipython.run_code('raise Exception("No Ganga Job is defined in cell magic.")')
            return
        try:
            with capture_output() as ganga_job_output:
                self.ipython.run_code(raw_cell)
        except Exception as e:
            print("GangaMonitor: %s" % str(e))
        else:
            jobid = self.ipython.user_ns[job_obj_name].id
            self.send_job_info(jobid, self.cell)
            # Start new thread for sending status
            status_thread = Thread(target=self.send_job_status, args=(jobid, self.cell))
            status_thread.start()
            return [ganga_job_output]
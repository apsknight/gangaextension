from __future__ import print_function
import re
from IPython.utils.io import capture_output
import time
from threading import Thread

# Import Ganga
ganga_imported = False
with capture_output() as ganga_import_output:
    try:
        import ganga.ganga
        ganga_imported = True
    except ImportError as e:
        print("GangaMonitor: Unable to import Ganga in Python \n %s \n" % str(e))

if ganga_imported:
    print("GangaMonitor: Ganga Imported succesfully")

class GangaMonitor:
    """
    Main singleton object for running Ganga as Python API.
    """
    def __init__(self, ipython):
        self.ipython = ipython
        self.cell = None
        self.ipython.run_code("import ganga.ganga")

    def __handle_incoming_msg(self, msg):
        print("Message recieved from frontend: \n %s \n" % str(msg))

        data = msg["content"]["data"]

        if data["msgtype"] == "nblocation":
            ganga.jobs[int(data["id"])].comment = str(data['nblocation'])

        # If cancellation is requested, kill the job.
        if data["msgtype"] == "cancel":
            ganga.jobs[int(data["id"])].kill()
        
        # If resubmission is requested, resubmit job and start monitoring thread.
        if data["msgtype"] == "resubmit":
            id = int(data["id"])
            job_obj = ganga.jobs[id]
            if len(job_obj.subjobs) == 0 and str(job_obj.status) == "failed":
                job_obj.resubmit()
            else:
                for sj in job_obj.subjobs:
                    if str(sj.status) == "failed":
                        sj.resubmit()
            self.job_obj = job_obj
            self.send_job_info()
            self.send_job_status()

        # If cellinfo is recieved, store it.
        if data["msgtype"] == "cellinfo":
            self.cell = data["cell_id"]

    def register_comm(self):
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
        self.comm.send(msg)

    def extract_job_obj(self, code):
        """
        Extract the job object from cell magic code.
        For Ex. if code is:
        > j = Ganga.Job()
        > # j2 = Ganga.Job()
        > # j2.submit()
        > j.submit()
        This method will return 'j'.
        """

        # Remove comments from code
        code = re.sub(r'(?m)^ *#.*\n?', '', code)

        regex = r"(\w+)\s*=\s*ganga.Job\(\)"
        matches = re.finditer(regex, code, re.MULTILINE)

        obj_name = ""
        for match in matches:
            obj_name = match.group(1)
        
        if obj_name == "":
            raise Exception('No Job is defined in magic cell')

        return str(obj_name)

    def send_job_info(self):
        """
        Send informtion related to Job to frontend.
        """
        job_obj = self.ipython.user_ns['job_obj']
        job_info = {
                "msgtype": "jobinfo",
                "id": job_obj.id,
                "cell_id": self.cell,
                "name": str(job_obj.name),
                "backend": str(job_obj.backend.__class__.__name__),
                "subjobs": len(job_obj.subjobs),
                "status": "submitted",
                "job_submission_time": str(job_obj.time.submitting())[:19],
                "application": str(job_obj.application).split()[0],
                "splitter": str(job_obj.splitter).split()[0],            
            }
        if job_info["subjobs"] > 0:
            job_info.update({"subjob_submission_time": {}})
            for sj in job_obj.subjobs:
                job_info["subjob_submission_time"][str(sj.id)] = str(sj.time.submitting())[:19]
            
        self.send(job_info)

    def send_job_status(self):
        """
        Send status of job to frontend
        """
        job_obj = self.ipython.user_ns['job_obj']
        endpoints = ["completed", "killed", "failed"]
        while True:
            self.ipython.run_code('ganga.runMonitoring()')
            job_obj = self.ipython.user_ns['job_obj']
            job_status = {
                "msgtype": "jobstatus",
                "id": job_obj.id,
                "cell_id": self.cell,
                "status": str(job_obj.status),
            }
            if (job_status["status"] is "completed"):
                job_status.update({"runtime": str(job_obj.time.runtime())})
            if len(job_obj.subjobs) > 0:
                job_status.update({"subjob_status": {}})
                job_status.update({"subjob_runtime": {}})
                for sj in job_obj.subjobs:
                    job_status["subjob_status"][str(sj.id)] = str(sj.status)
                    if (str(sj.status) is "completed"):
                        job_status["subjob_runtime"][str(sj.id)] = str(sj.time.runtime())
            time.sleep(0.5)
            self.send(job_status)
            if (job_status["status"] in endpoints):
                break

    def run(self, raw_cell):
        """
        Submit job in kernel, send info and start monitoring thread.
        """
        job_obj_name = self.extract_job_obj(raw_cell)
        mirror_code = "job_obj = %s" % job_obj_name
        try:
            with capture_output() as ganga_job_output:
                self.ipython.run_code(raw_cell)
                self.ipython.run_code('ganga.runMonitoring()')
        except Exception as e:
            print("GangaMonitor: %s" % str(e))
        else:
            self.ipython.run_code(mirror_code)
            self.send_job_info()
            # Start new thread for sending status
            status_thread = Thread(target=self.send_job_status, args=())
            status_thread.start()
            return [ganga_job_output]
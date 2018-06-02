from __future__ import print_function
import re
from IPython.utils.io import capture_output
import time

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
    
    def __handle_incoming_msg(self, msg):
        print("Message recieved from frontend: \n %s \n" % str(msg))
        data = msg["content"]["data"]
        if data["msgtype"] == "cancel":
            ganga.jobs[int(data["id"])].kill()
            job_obj = self.job_obj
            job_status = {
                "msgtype": "jobstatus",
                "id": job_obj.id,
                "status": str(job_obj.status),
            }
            if len(job_obj.subjobs) > 0:
                job_status.update({"subjob_status": {}})
                for sj in job_obj.subjobs:
                    job_status["subjob_status"][str(sj.id)] = str(sj.status)

            self.send(job_status)

    def register_comm(self):
        self.ipython.kernel.comm_manager.register_target("GangaMonitor", self.comm_target)
    
    def comm_target(self, comm, msg):
        print("Comm Opened: \n %s \n" % str(msg))
        self.comm = comm

        @self.comm.on_msg
        def _recv(msg):
            self.__handle_incoming_msg(msg)
        self.comm.send({"msgtype": "commopen"})

    def send(self, msg):
        self.comm.send(msg)

    def extract_job_obj(self, code): # Handle not found error
        regex = r"(\w+)\s*=\s*ganga.Job\(\)"
        matches = re.finditer(regex, code, re.MULTILINE)

        for match in matches:
            obj_name = match.group(1)
        
        return str(obj_name)

    def send_job_info(self):
        job_obj = self.job_obj
        job_info = {
                "msgtype": "jobinfo",
                "id": job_obj.id,
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
        job_obj = self.job_obj
        endpoints = ["completed", "killed", "failed"]
        while True:
            ganga.runMonitoring()
            job_status = {
                "msgtype": "jobstatus",
                "id": job_obj.id,
                "status": str(job_obj.status),
            }
            if (job_status["status"] in endpoints):
                job_status.update({"runtime": str(job_obj.time.runtime())})
            if len(job_obj.subjobs) > 0:
                job_status.update({"subjob_status": {}})
                job_status.update({"subjob_runtime": {}})
                for sj in job_obj.subjobs:
                    job_status["subjob_status"][str(sj.id)] = str(sj.status)
                    if (str(sj.status) in endpoints):
                        job_status["subjob_runtime"][str(sj.id)] = str(sj.time.runtime())
            time.sleep(1)
            self.send(job_status)
            if (job_status["status"] in endpoints):
                break

    def run(self, raw_cell):
        job_obj_name = self.extract_job_obj(raw_cell)
        mirror_code = "job_obj = %s" % job_obj_name

        try:
            with capture_output() as ganga_job_output:
                exec(raw_cell)
                ganga.runMonitoring()
                print("GangaMonitor: Monitoring ON")
        except Exception as e:
            print("GangaMonitor: %s" % str(e))
        else:
            exec(mirror_code)
            self.job_obj = job_obj
            self.send_job_info()
            self.send_job_status()
            
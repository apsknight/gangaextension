from notebook.base.handlers import IPythonHandler
from importlib import import_module
import sys

if sys.version_info >= (3, 0):
    import ganga
else:
    import ganga.ganga
ganga.runMonitoring()

class GangaArchiveHandler(IPythonHandler):
     
    def get(self):       

        try:
            size = int(self.get_argument('size', 20))
            jobid = int(self.get_argument('jobid', -1))
            remove = True if self.get_argument('remove', None) else False            
            total_jobs = len(ganga.jobs)
            start = int(self.get_argument('start', ganga.jobs[-1].id))
            endpoints = ["completed", "killed", "failed"]
            result = {}

            if jobid is not -1:
                if remove:
                    job = ganga.jobs[jobid]
                    job.remove()
                    result['id'] = jobid
                    result['remove'] = "true"                    
                else:
                    job = ganga.jobs[jobid]

                    result = {
                    "msgtype": "jobstatus",
                    "id": jobid,
                    "status": str(job.status)
                    }
                    
                    if (result["status"] is "completed"):
                        result.update({"runtime": str(job.time.runtime())})
                    if len(job.subjobs) > 0:
                        result.update({"subjob_status": {}})
                        result.update({"subjob_runtime": {}})
                        for sj in job.subjobs:
                            result["subjob_status"][str(sj.id)] = str(sj.status)
                            if (str(sj.status) is "completed"):
                                result["subjob_runtime"][str(sj.id)] = str(sj.time.runtime())

            
            else:
                result = {"data": {}, "start": start, "size": size, "total_jobs": total_jobs}   
                print(range(start, max(start-size, 0), -1))
                for i in range(start, max(start-size, 0), -1):
                    try:
                        job = ganga.jobs[i]
                    except:
                        continue
                    result["data"][str(job.id)] = {}
                    result["data"][str(job.id)]["name"] = str(job.name)
                    result["data"][str(job.id)]["backend"] = str(job.backend.__class__.__name__)
                    result["data"][str(job.id)]["status"] = str(job.status)
                    result["data"][str(job.id)]["nblocation"] = str(job.comment)
                    try:
                        result["data"][str(job.id)]["file_name"] = str(job.application.exe.name)
                    except:
                        pass
                    try:
                        result["data"][str(job.id)]["runtime"] = str(job.time.runtime())
                    except:
                        pass
                    result["data"][str(job.id)]["subjobs"] = len(job.subjobs)
                    result["data"][str(job.id)]["application"] = str(job.application).split()[0]
                    result["data"][str(job.id)]["splitter"] = str(job.splitter).split()[0]
                    result["data"][str(job.id)]["job_submission_time"] = str(job.time.submitting())[:19]
                    
                    if len(job.subjobs) > 0:
                        result["data"][str(job.id)]["subjob_status"] = {}
                        result["data"][str(job.id)]["subjob_submission_time"] = {}
                        for sj in job.subjobs:
                            result["data"][str(job.id)]["subjob_status"][str(sj.id)] = {}                    
                            result["data"][str(job.id)]["subjob_status"][str(sj.id)]["status"] = str(sj.status)
                            result["data"][str(job.id)]["subjob_status"][str(sj.id)]["subjob_submission_time"] = str(sj.time.submitting())[:19]
                            try:
                                result["data"][str(job.id)]["subjob_status"][str(sj.id)]["runtime"] = str(sj.time.runtime())
                            except:
                                pass

            self.write(result)
            self.flush()
            self.finish()
        except Exception as e:
            exc_type, exc_obj, exc_tb  = sys.exc_info()
            print("GangaArchive: ", e, exc_type, exc_tb.tb_lineno)
        
    def on_finish(self):
        '''
        Currently does nothing. Can be used for de-importing Ganga.
        '''
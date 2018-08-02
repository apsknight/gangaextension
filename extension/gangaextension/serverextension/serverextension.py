from notebook.base.handlers import IPythonHandler
import sys
import os

# For now write logs in ~/ganga-monitoring.txt
sys.stdout = open(os.path.join(os.path.expanduser('~'), 'ganga-monitoring.txt'), 'w')

# Currently there are two different versions of Ganga, one for Py2 and other for Py3.
# Note: The Ganga must have Job Sharing enabled for monitoring Jobs in Server Extension.
if sys.version_info >= (3, 0):
    # If Jupyter server is running on Py3
    import ganga
else:
    # If Jupyter server is running on Py2
    import ganga.ganga

# On importing in Python, Ganga doesn't start monitoring itself, thus following line is required. 
ganga.enableMonitoring()

class GangaArchiveHandler(IPythonHandler):
    
    def get(self):
        """
        This method handles all the `GET` requests recieved on the server extension. 
        Qyery Arguments:
        size: Return these many jobs (default is 20).
        jobid: Query specifically for this jobid
        remove: Remove Job with id jobid (Also need jobid argument for this.)
        cancel: Kill Job with id jobid (Also need jobid argument for this.)
        start: Starting point for returning info. (Return job info from id `start` to `start+size`)
        """
        size = int(self.get_argument('size', 20))
        jobid = int(self.get_argument('jobid', -1))
        remove = True if self.get_argument('remove', 'false').lower() == 'true' else False            
        cancel = True if self.get_argument('cancel', 'false').lower() == 'true' else False
        start = int(self.get_argument('start', 0))
        end = int(self.get_argument('end', ganga.jobs[-1].id))

        # Size can't be greater than len(ganga.jobs) and lesser than 0
        size = max(size, 0)
        size = min(size, len(ganga.jobs))

        # End can't be greater than ganga.jobs[-1].id and lesser than 0
        end = max(end, 0)
        end = min(end, ganga.jobs[-1].id)

        # start can't be lesser than 0 and greater the ganga.jobs[-1].id and end - start + 1 <= size
        start = max(start, 0)
        start = min(start, ganga.jobs[-1].id)
        if end - start + 1 > size:
            start = max(end - size + 1, 0)

        if jobid != -1:
            # Job specifiec data has been asked by client.
            # No need to compile data of other Jobs except `jobid`
            if remove:
                # If Job has to be removed from Job repository.
                self.remove_job(jobid)
                return
            elif cancel:
                # Else if Job is running/submitted/submitting/new and has to be killed.
                self.cancel_job(jobid)
                return
            else:
                # If neither remove not cancel is present in query, send the status of the Job.
                self.query_info([jobid])
                return

        else:
            # List containing JobID of those Jobs whom data needs to be sent to client.
            job_list = range(start, end + 1)
            self.query_info(job_list)
            return

    def remove_job(self, jobid):
        # Remove the Job with ID `jobid` from Ganga Repo using `job.remove()` method.
        result = dict()
        result['id'] = jobid
        try:
            job = ganga.jobs[jobid]
            job.remove()
            result['remove'] = 'true'
        except Exception as err:
            result['remove'] = 'false'
            result['error'] = str(err)

        self.send_to_client(result)
        return

    def cancel_job(self, jobid):
        # Kill the Job with ID `jobid` from Ganga Repo using `job.kill()` method.
        result = dict()
        result['id'] = jobid
        try:
            job = ganga.jobs[jobid]
            job.kill()
            result['cancel'] = 'true'
        except Exception as err:
            result['cancel'] = 'false'
            result['error'] = str(err)

        self.send_to_client(result)
        return

    def query_info(self, jobList):
        # If empty list is passed, return
        if len(jobList) == 0:
            return

        # Send current Job info of jobs with Jobid's listed in `jobList`
        result = dict()
        # Store start ID in `start`
        result['start'] = jobList[0]
        # Store end ID in `end`
        result['end'] = jobList[-1]
        # Store size in `size`
        result['size'] = len(jobList)
        # Store Total Jobs in `total_jobs`
        # Note: Also counting removed/corrupted Jobs in total Jobs.
        result['total_jobs'] = str(int(ganga.jobs[-1].id) + 1)
        # Store jobs data in `data`
        result['data'] = dict()
        for job_id in jobList:
            result['data'][str(job_id)] = dict()

            try:
                job = ganga.jobs[job_id]
                result['data'][str(job_id)]['name'] = str(job.name)
                result['data'][str(job_id)]['backend'] = str(job.backend.__class__.__name__)
                result['data'][str(job_id)]['status'] = str(job.status)
                result['data'][str(job_id)]['name'] = str(job.name)
                result['data'][str(job_id)]['subjobs'] = len(job.subjobs)
                result['data'][str(job_id)]['application'] = str(job.application).split()[0]
                result['data'][str(job_id)]['splitter'] = str(job.splitter).split()[0]

                try:
                    # Try to find the name of Executable file
                    result['data'][str(job_id)]['file_name'] = str(job.application.exe.name)
                except AttributeError:
                    # If not present, provide executable type.
                    result['data'][str(job_id)]['file_name'] = str(job.application.exe)

                # Don't ask submission time if Job hasn't been submitted yet.
                if str(job.status) != 'new':
                    result['data'][str(job_id)]['job_submission_time'] = str(job.time.submitting())[:19]
                else:
                    result['data'][str(job_id)]['job_submission_time'] = ''
                
                # Don't ask runtime if Job hasn't been completed yet.
                if str(job.status) == 'completed':
                    result['data'][str(job_id)]['runtime'] = str(job.time.runtime())
                else:
                    result['data'][str(job_id)]['runtime'] = ''
                
                # If subjobs are present add their info too.
                if len(job.subjobs) > 0:
                    result['data'][str(job_id)]['subjob_status'] = dict()
                    for sj in job.subjobs:
                        result['data'][str(job_id)]['subjob_status'][str(sj.id)] = dict()                  
                        result['data'][str(job_id)]['subjob_status'][str(sj.id)]['status'] = str(sj.status)

                        # Don't ask submission time if Subjob hasn't been submitted yet.
                        if str(sj.status) != 'new':
                           result['data'][str(job_id)]['subjob_status'][str(sj.id)]['subjob_submission_time'] = str(sj.time.submitting())[:19]
                        else:
                            result['data'][str(job_id)]['subjob_status'][str(sj.id)]['subjob_submission_time'] = ''
                        
                        # Don't ask runtime if Subjob hasn't been completed yet.
                        if str(sj.status) == 'completed':
                            result['data'][str(job_id)]['subjob_status'][str(sj.id)]['runtime'] = str(sj.time.runtime())
                        else:
                            result['data'][str(job_id)]['subjob_status'][str(sj.id)]['runtime'] = ''
            
            except:
                # Might end up here if Job with ID `job_id` has been removed or corrupted.
                result['data'][str(job_id)]['status'] = 'removed'

        self.send_to_client(result)
        return

    
    def send_to_client(self, result):
        # Send `result` to client via Jupyter's Tornado server.
        self.write(result)
        self.flush()
        self.finish()
        return
from __future__ import print_function
import re
from IPython.utils.io import capture_output
import time
from threading import Thread
from cPickle import loads as pickle_loads

# Import Ganga
ganga_imported = False
with capture_output() as ganga_import_output:
    try:
        import ganga.ganga
        from ganga import *
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
        self.ipython.run_code("from ganga import *")

    def extract_job_obj(self, code): # Handle not found error
        regex = r"(\w+)\s*=\s*Job\("
        matches = re.finditer(regex, code, re.MULTILINE)

        for match in matches:
            obj_name = match.group(1)
        
        return str(obj_name)

    def run(self, raw_cell, ipython_ns):
        # Update Current namespace with IPython's name space
        # ns_dict = pickle_loads(ipython_ns)
        # locals().update(ns_dict)

        job_obj_name = self.extract_job_obj(raw_cell)
        mirror_code = "job_obj = %s" % job_obj_name

        try:
            with capture_output() as ganga_job_output:
                self.ipython.run_code(raw_cell)
                self.ipython.run_code('runMonitoring()')
                # print("GangaMonitor: Monitoring ON")
        except Exception as e:
            print("GangaMonitor: %s" % str(e))
        else:
            self.ipython.run_code(mirror_code)
            return [ganga_job_output]
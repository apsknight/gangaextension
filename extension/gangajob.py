from __future__ import print_function
import ganga.ganga
from inspect import ismodule as inspect_ismodule
from importlib import import_module
from inspect import ismodule as inspect_ismodule
from importlib import import_module

# Messaging
import json
import pickle

# IPython
from IPython.utils.io import capture_output
from IPython.core.interactiveshell import InteractiveShell
import time

def run(raw_cell):
    # ganga_shell = InteractiveShell()
    # ganga_shell.call_pdb = False
    # ganga_shell.pdb = False

    # shell_output = ""

    # with capture_output() as io:
    #     _ = ganga_shell.run_cell("import ganga.ganga", silent=True, shell_futures=False)
    #     __ = ganga_shell.run_cell(raw_cell, silent=True, shell_futures=False)
    # ganga_ns = {}
    # exec("import ganga.ganga") in ganga_ns
    exec(raw_cell)
    exec("job_obj = j")
    print(job_obj.status)

    while(job_obj.status == "submitted"):
        print(job_obj.status)
        time.sleep(2)
    print(job_obj.status)
    print(job_obj.id)
        
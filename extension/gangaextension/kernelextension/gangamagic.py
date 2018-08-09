from __future__ import print_function

# IPython Magic Modules
from IPython.core.magic import (Magics, magics_class, line_cell_magic)
from ipykernel import zmqshell
# Module for submitting Ganga Jobs and commnicaing with frontend
from gangajob import GangaMonitor

@magics_class
class Ganga(Magics):
    """
    Class for registering '%%ganga' magic cell in kernel.
    This is standard class required by IPython for registring a cell magic in kernel.
    `load_ipython_extension` method also register a Comm in kernel using `gangajob` module for
    communication with frontend.
    Whenever a %%ganga magic cell is executed it's code goes to `run` method in `gangajob` module. 
    """

    def __init__(self, shell, **kwargs):
        super(Ganga, self).__init__(shell, **kwargs)
        self.shell = shell

    @line_cell_magic
    def ganga(self, line, cell):
        """
        Called when Ganga Magic is executed
        """

        # Inform frontend that a cell execution has been started so that 
        # it can detect and store from which cell the execution has been started.
        monitor.send({"msgtype": "magic_execution_start"})

        code = ""
        if cell is None:
            code = line
        else:
            code = cell

        # Execute content of Ganga Cell Magic and store output(if any) to op
        op = monitor.run(code)

        # Print stderr and stdout (if any)
        if op is not None:
            if op[0].stderr:
                print(op[0].stderr)
            if op[0].stdout:
                print(op[0].stdout)

# Default ipython entrypoint for kernel extension.
def load_ipython_extension(ipython):
    if not isinstance(ipython, zmqshell.ZMQInteractiveShell):
        # Ipython not running through notebook. So exiting.
        return
    global monitor
    monitor = GangaMonitor(ipython)
    monitor.register_comm()
    ipython.register_magics(Ganga)
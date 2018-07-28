from __future__ import print_function

# IPython Magic Modules
from IPython.core.magic import (Magics, magics_class, line_cell_magic)
# Module for submitting Ganga Jobs and commnicaing with frontend
from gangajob import GangaMonitor

@magics_class
class Ganga(Magics):
    """
    Class for registering '%%ganga' magic cell in kernel.
    """

    def __init__(self, shell, **kwargs):
        super(Ganga, self).__init__(shell, **kwargs)
        self.shell = shell

    @line_cell_magic
    def ganga(self, line, cell):
        """
        Called when Ganga Magic is executed
        """

        # Inform frontend
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
    global monitor
    monitor = GangaMonitor(ipython)
    monitor.register_comm()
    ipython.register_magics(Ganga)
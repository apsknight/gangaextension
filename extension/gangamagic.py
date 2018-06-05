from __future__ import print_function
from IPython.core.magic import (Magics, magics_class, line_cell_magic)
from gangajob import GangaMonitor

@magics_class
class Ganga(Magics):
    """
    Class for registering '%%ganga' magic cell in kernel.
    """
    @line_cell_magic
    def ganga(self, line, cell):
        monitor.send({"msgtype": "magic_execution_start"})
        code = ""
        if cell is None:
            code = line
        else:
            code = cell
        
        # Start execution
        monitor.run(code)

# Default ipython entrypoint for kernel extension.
def load_ipython_extension(ipython):
    global monitor
    monitor = GangaMonitor(ipython)
    monitor.register_comm()
    ipython.register_magics(Ganga)
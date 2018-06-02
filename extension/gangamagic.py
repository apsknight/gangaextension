from __future__ import print_function
from IPython.core.magic import (Magics, magics_class, line_cell_magic)
from gangajob import GangaMonitor
from threading import Thread

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
        
        # Create new thread to avoid kernel interruption while Job is running.
        ganga_thread = Thread(target=monitor.run, args=(code,))
        ganga_thread.start()

# Default ipython entrypoint for kernel extension.
def load_ipython_extension(ipython):
    global monitor
    monitor = GangaMonitor(ipython)
    monitor.register_comm()
    ipython.register_magics(Ganga)
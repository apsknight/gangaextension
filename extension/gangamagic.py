from __future__ import print_function
from IPython.core.magic import (Magics, magics_class, line_magic, cell_magic, line_cell_magic)
from IPython.core.magic_arguments import (argument, magic_arguments,
    parse_argstring)
from gangajob import GangaMonitor

@magics_class
class Ganga(Magics):
    """"""

    @line_cell_magic
    def ganga(self, line, cell):
        monitor.send({"msgtype": "magic_execution_start"})
        code = ""
        if cell is None:
            code = line
        else:
            code = cell
            
        monitor.run(code)


def load_ipython_extension(ipython):
    global monitor
    monitor = GangaMonitor(ipython)
    monitor.register_comm()
    ipython.register_magics(Ganga)
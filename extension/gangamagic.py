from __future__ import print_function
from IPython.core.magic import (Magics, magics_class, line_cell_magic)
from IPython.core.magic_arguments import argument, magic_arguments, parse_argstring
from gangajob import GangaMonitor
import logging
import os

@magics_class
class Ganga(Magics):
    """
    Class for registering '%%ganga' magic cell in kernel.
    """

    @magic_arguments()
    @argument('-s', '--save', type=str, help='Save as file')

    @line_cell_magic
    def ganga(self, line, cell):
        args = parse_argstring(self.ganga, line)

        if args.save:
            file_name = str(args.save)
            code = ""
            if cell is None:
                code = line
            else:
                code = cell
            with open(file_name, 'w') as f:
                f.write(code)       

        else:
            logger.info("Magic Cell Execution starts")
            monitor.send({"msgtype": "magic_execution_start"})
            code = ""
            if cell is None:
                code = line
            else:
                code = cell
            
            logger.info("Sending Code to Ganga from kernel")
            # Start execution
            monitor.run(code)

# Default ipython entrypoint for kernel extension.
def load_ipython_extension(ipython):
    global logger
    logger = logging.getLogger("gangainterface")
    logger.setLevel(logging.DEBUG)
    logger.propagate = False
    # For debugging this module - Writes logs to a file
    fh = logging.FileHandler("gangainterface_kernelextension.log", mode="w")
    fh.setLevel(logging.DEBUG)
    formatter = logging.Formatter(
        "%(levelname)s:  %(asctime)s - %(name)s - %(process)d - %(processName)s - \
         %(threadName)s\n %(message)s \n")
    fh.setFormatter(formatter)
    # logger.addHandler(fh) ## Comment this line to disable logging to a file.

    global monitor
    monitor = GangaMonitor(ipython)
    monitor.register_comm()
    logger.info("Registering Ganga Magic in kernel.")
    ipython.register_magics(Ganga)
    logger.info("Done Done")
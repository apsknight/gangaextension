from __future__ import print_function

import logging
from cPickle import dumps as pickle_dumps
from cPickle import loads as pickle_loads
from cPickle import PicklingError
from inspect import ismodule

from IPython.core.magic import (Magics, magics_class, line_cell_magic)
from IPython.core.magic_arguments import argument, magic_arguments, parse_argstring

from gangajob import GangaMonitor

DEFAULT_BLACKLIST = ['__builtin__', '__builtins__', '__doc__',
                     '__loader__', '__name__', '__package__',
                     '__spec__', '_sh', 'exit', 'quit', 'MyMagics',
                     'Ganga', 'Magics', 'cmagic', 'magics_class']

@magics_class
class Ganga(Magics):
    """
    Class for registering '%%ganga' magic cell in kernel.
    """
    # @magic_arguments()
    # @argument('-s', '--save', type=str, help='Save as file')

    def __init__(self, shell, **kwargs):
        super(Ganga, self).__init__(shell, **kwargs)
        self.shell = shell

    def _pickle_ns(self):
        new_ns = dict()
        for k, v in self.shell.user_ns.items():
            if not k in DEFAULT_BLACKLIST:
                try:
                    if ismodule(v):
                        pass
                    else:
                        _ = pickle_dumps({k: v})
                        new_ns[k] = v
                except PicklingError:
                    continue
                except Exception:
                    continue
        
        return new_ns

    @line_cell_magic
    def ganga(self, line, cell):
        # args = parse_argstring(self.ganga, line)

        # if args.save:
        #     # file_name = str(args.save)
        #     # code = ""
        #     # if cell is None:
        #     #     code = line
        #     # else:
        #     #     code = cell
        #     # with open(file_name, 'w') as f:
        #     #     f.write(code)     
        #     pass  

        # else:
            # logger.info("Magic Cell Execution starts")
        monitor.send({"msgtype": "magic_execution_start"})
        code = ""
        if cell is None:
            code = line
        else:
            code = cell
        
        # logger.info("Sending Code to Ganga from kernel")
        # Start execution
        current_ns = pickle_dumps(self._pickle_ns())
        monitor.run(code, (current_ns))

# Default ipython entrypoint for kernel extension.
def load_ipython_extension(ipython):
    # global logger
    # logger = logging.getLogger("gangainterface")
    # logger.setLevel(logging.DEBUG)
    # logger.propagate = False
    # For debugging this module - Writes logs to a file
    # fh = logging.FileHandler("gangainterface_kernelextension.log", mode="w")
    # fh.setLevel(logging.DEBUG)
    # formatter = logging.Formatter(
        # "%(levelname)s:  %(asctime)s - %(name)s - %(process)d - %(processName)s - \
        #  %(threadName)s\n %(message)s \n")
    # fh.setFormatter(formatter)
    # logger.addHandler(fh) ## Comment this line to disable logging to a file.
    global monitor
    monitor = GangaMonitor(ipython)
    monitor.register_comm()
    # logger.info("Registering Ganga Magic in kernel.")
    ipython.register_magics(Ganga)
    # logger.info("Done Done")
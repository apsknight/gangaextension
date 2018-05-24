from __future__ import print_function
from IPython.core.magic import (Magics, magics_class, line_magic, cell_magic, line_cell_magic)
from IPython.core.magic_arguments import (argument, magic_arguments,
    parse_argstring)
from gangajob import run

@magics_class
class Ganga(Magics):
    """"""
    # @magic_arguments()
    # @argument("-n", "--name", type=str, help="Name of the Job")
    # @argument("-b", "--backend", type=str, help="Choose backend")
    # @argument("-s", "--splitter", type=str, help="Choose backend")
    # @argument("--application", type=str, help="Application to exectute")

    @line_cell_magic
    def ganga(self, line, cell):
        # args = parse_argstring(self.ganga, line)
        # print(args.name, args.backend)
        code = ""
        if cell is None:
            code = line
        else:
            code = cell

        run(code)


def load_ipython_extension(ipython):
    ipython.register_magics(Ganga)
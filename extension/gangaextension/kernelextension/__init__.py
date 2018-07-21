import sys

if sys.version_info >= (3, 0):
    from gangaextension.kernelextension.gangamagic import *
else:
    from gangamagic import *
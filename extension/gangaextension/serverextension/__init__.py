import sys
from notebook.utils import url_path_join

if sys.version_info >= (3, 0):
    from .serverextension import GangaArchiveHandler
    from .swanhandler import SwanHandler
else:
    from serverextension import GangaArchiveHandler
    from swanhandler import SwanHandler

def load_jupyter_server_extension(nb_server_app):
    web_app = nb_server_app.web_app
    host_pattern = '.*$'
    web_app.add_handlers(host_pattern, [
        (url_path_join(web_app.settings['base_url'], r'/gangajoblist'),
         GangaArchiveHandler)
    ])
    web_app.add_handlers(host_pattern, [
        (url_path_join(web_app.settings['base_url'], r'/swangangalist'),
         SwanHandler)
    ])
    print("GANGAEXTENSION: ServerExtension Loaded")

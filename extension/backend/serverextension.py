from notebook.base.handlers import IPythonHandler
from notebook.utils import url_path_join

class GangaRequestHandler(IPythonHandler):
    def get(self):
        self.finish("You requested Ganga")

def load_jupyter_server_extension(nb_server_app):
    """
    Called when the Jupyter server extension is loaded.
    Args:
        nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
    """
    print("Loading Ganga Server Extension")
    web_app = nb_server_app.web_app
    host_pattern = '.*$'
    route_pattern = url_path_join(web_app.settings['base_url'], '/ganga')
    web_app.add_handlers(host_pattern, [(route_pattern, GangaRequestHandler)])
    print(host_pattern, route_pattern)
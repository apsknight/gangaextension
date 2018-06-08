from notebook.base.handlers import IPythonHandler
import tornado.web
from tornado import httpclient
import json, os

endpoint = 'gangajoblist'

class GangaExtensionHandler(IPythonHandler):

    @tornado.web.asynchronous
    def get(self):
        with open('gangajoblist.json') as f:
            jobsdata = get_json()

        self.write(jobsdata)
        self.finish()

def load_jupyter_server_extension(nb_server_app):
    """
    Called when the Jupyter server extension is loaded.
    Args:
        nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
    """
    print("GANGAEXTENSION_SERVER: Loading Server Extension")
    web_app = nb_server_app.web_app
    host_pattern = ".*$"
    route_pattern = url_path_join(
        web_app.settings["base_url"], endpoint + ".*")
    web_app.add_handlers(host_pattern, [(route_pattern, GangaExtensionHandler)])

def _jupyter_server_extension_paths():
    return [{
        'module': __name__
    }]
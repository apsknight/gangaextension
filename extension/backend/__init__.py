def _jupyter_server_extension_paths():
    """This function is used by 'jupyter serverextension' command to install Jupyter Server Extension"""
    return [{
        "module": "backend.serverextension"
}]
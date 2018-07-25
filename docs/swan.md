**[Final Report](index.md)** |
**[Installation](install.md)** |
**[How it Works](how.md)** |
**[Code](https://github.com/apsknight/gangaextension)**

## Configure Jupyterhub to add Ganga Extension in SWAN

Clone the extension to the machine which is running jupyterhub using following command,
```bash
git clone https://github.com/apsknight/gangaextension.git
```

### Steps to be followed:
- Add `gangaextension` package to `/ramdisk/extra_libs/modules`.
    ```bash
    cp -r gangaextension/extension/gangaextension /ramdisk/extra_libs/modules
    ```

- Add frontend nbextension to `/ramdisk/extra_libs/nbextensions/` and rename it to `gangaextension`
    ```bash
    cp -r gangaextension/extension/frontend  /ramdisk/extra_libs/nbextensions

    mv /ramdisk/extra_libs/nbextensions/frontend /ramdisk/extra_libs/nbextensions/gangaextension
    ```

- Enable `serverextension` by modifying `/ramdisk/extra_libs/etc_jupyter/jupyter_notebook_config.json` to
    ```json
    {
    "NotebookApp": {
        "nbserver_extensions": {
            "swancontents.handlers": true,
            "sparkmonitor.serverextension": true,
            "swannotebookviewer.notebookviewer": true,
        "gangaextension.serverextension": true
            }
    }
    }
    ```

- Enable notebook section frontend extensions by modifying `/ramdisk/extra_libs/etc_jupyter/nbconfig/notebook.json` to
    ```json
    {
    "load_extensions": {
        "sparkmonitor/extension": true,
        "swanhelp/extension": true,
        "swannotifications/extension": true,
        "swanshare/extension": true,
        "gangaextension/extension": true
        }
    }
    ```

- Enable tree section frontend extensions by modifying `/ramdisk/extra_libs/etc_jupyter/nbconfig/tree.json` to
    ```json
    {
    "load_extensions": {
        "swanhelp/extension": true,
        "swannotifications/extension": true,
        "swanshare/extension": true,
        "swanintro/extension": true,
        "gangaextension/extension": true
        }
    }

    ```
- Update `/ramdisk/extra_libs/templates/page.html` to add `Ganga Tab` link in SWAN header.
    + The updated `page.html` containing Ganga Job tab can be [found here](https://gist.github.com/apsknight/f0d4cebf911dadf4e98366e98f934f2e).

- Update `/ramdisk/extra_libs/nbextensions/swancontents/notebooklist.js` to contain `Ganga Tab`.
    + The updated `notebooklist.js` containing Ganga Job tab can be [found here](https://gist.github.com/apsknight/89361825773806eff1bd3e7a1c4f6691).

- Create a file with name `gangapage.html` in `/ramdisk/extra_libs/templates` to render Ganga Tab Page in SWAN.
    ```bash
    cp -f gangaextension/extension/gangaextension/serverextension/gangapage.html /ramdisk/extra_libs/templates
    ```

- In the docker image that spawns SWAN.
    + Install [this branch](https://github.com/apsknight/ganga/tree/job_sharing) (job_sharing) in Py2 environment and [this branch](https://github.com/apsknight/ganga/tree/ganga_python3) (ganga_python3) in Py3 environment.
    + Update IPython Configuration to load Kernel Extension on startup.
    ```bash
    echo "c.InteractiveShellApp.extensions.append('gangaextension.kernelextension')" >>  $(ipython profile locate default)/ipython_kernel_config.py
    ```

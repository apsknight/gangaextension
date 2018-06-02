# Ganga Jupyter Interface
> A Jupyter Extension for submitting Ganga Jobs inside Notebook.

This Project is currently under development, for demo/testing please follow these commands:
```bash
git clone https://github.com/apsknight/ganga_interface.git

cd ganga_interface

# For installing Frontend extension
jupyter nbextension install extension/frontend
jupyter nbextension enable frontend/extension

# For installing Kernel Extension
cp -r extension/ ~/.ipython/extensions/
ipython profile create && \
echo "c.InteractiveShellApp.extensions.append('extension')" >>  $(ipython profile locate default)/ipython_kernel_config.py

# Run Jupyter Notebook
cd Notebooks
jupyter notebook
```

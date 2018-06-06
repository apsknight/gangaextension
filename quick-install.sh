jupyter nbextension install extension/frontend --py --user --symlink
jupyter nbextension enable frontend/extension

ipython profile create && \
echo "c.InteractiveShellApp.extensions.append('extension')" >> \
$(ipython profile locate default)/ipython_kernel_config.py
ln -s extension $(ipython locate)/extensions/extension

cd notebooks
jupyter notebook --port=8888
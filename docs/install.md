**[Final Report](index.md)** |
**[Installation](install.md)** |
**[How it Works](how.md)** |
**[How to use](use.md)** |
**[Code](https://github.com/apsknight/gangaextension)**

# Installation

>This is for Jupyter Notebook installation for `SWAN` installation, please refer to [SWAN Installation page](swan.md)

## Prerequisite
- [Ganga](https://github.com/ganga-devs/ganga) version >= 7.0.1
- [Jupyter Notebook](http://jupyter.org/)

## Install
- Install the Extension Package with 
```bash
python -m pip install gangaextension
```

or Install directly from source
```
git clone https://github.com/apsknight/gangaextension.git
cd gangaextension/extension
python -m pip install -e .
```
- Install and enable `nbextension` in Jupyter Namespace
```bash
jupyter nbextension install --py gangaextension --sys-prefix --symlink
jupyter nbextension enable gangaextension --sys-prefix --py
```

- Enable Jupyter Server Extension
```bash
jupyter serverextension enable --py --sys-prefix gangaextension
```

## Configuring IPython Kernel Extension
- Create default IPython configuration profile (Skip if already exists)
```
ipython profile create
```
- Add `kernelextension` in configuration file to automatically load extension on IPython startup.
```bash
echo "c.InteractiveShellApp.extensions.append('gangaextension.kernelextension')" >>  $(ipython profile locate default)/ipython_kernel_config.py
```

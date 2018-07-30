**[Final Report](index.md)** |
**[Installation](install.md)** |
**[How it Works](how.md)** |
**[How to use](use.md)** |
**[Code](https://github.com/apsknight/gangaextension)**

# Gangaextension - How it works ?

The Jupyter Notebook is a web based application that follows a client-server architecture, it mainly comprises of three different parts,

- JavaScript frontend client
    + Renders the Jupyter Notebook interface inside browser.
- Notebook Server
    + Serves content to frontend client through various APIs and handlers.
- Kernel
    + Seperate process in Notebook Server for computing Notebook's cells.



![](https://user-images.githubusercontent.com/6822941/29751909-f040c276-8b71-11e7-951b-ff3cd3af6874.png)

The `gangaextension` also comprises of three differnet parts,

- [Frontend Extension](#frontend-extension)
    + [Notebook Section](#notebook-section)
    + [Tree Section](#tree-section)

- [Kernel Extension](#kernel-extension)
    + [IPython Cell Magic](#ipython-cell-magic)
    + [Ganga Job Submission](#ganga-job-submission)

- [Server Extension](#server-extension)
    + [Ganga Monitoring Session](#ganga-monitoring-session)
    + [Job List API](#job-list-api)
    + [SWAN Handler](#swan-handler)


## Frontend Extension
A front-end extension is a JavaScript file that defines an AMD module which exposes at least a function called `load_ipython_extension`. The frontend extension used for this project have two seperate parts,

- Notebook Section: This part communicate with kernel and render the Job Info widget below the Ganga Magic Cell. It also updates the status of Job in the widget. The communication between Kernel and notebook section frontend extension is done by Jupyter's Comm API.

- Tree Section: This part communicates with Server Extension and renders the Ganga Jobs Tab in Jupyter Tree view. The Ganga Jobs Tab displays information and status of all Jobs submitted to Ganga. The frontend extension makes AJAX calls to server extension and fetches the info and live status of Jobs.

## Kernel Extension

- IPython Cell Magic: IPython Kernel extensions is a Python module that modifies the interactive shell environment of IPython kernel. This extension register a magic (`%%ganga`) and modifies the user namespace to provide Ganga Shell variables to use within code cells. This extension recieves the code submitted by user in Ganga Magic and it submits this code to create a new Ganga Job.
- Ganga Job Submission: After succesful submission of Job, it sends Job Info and Job Status to frontend using Jupyter's Comm API. It also reload Job from disk periodically to fetch updates from Ganga Monitoring session runnning in Server Extension.
> This extension only submits the Job, the submitted Job is then monitored by another Ganga Session running in server extension. So killing the kernel doesn't kill the Job.

## Server Extension
Jupyter Notebook server extensions is a Python module that loads when the Notebook web server application starts. It creates a Ganga Session which picks and monitors the Job submitted in other Ganga Sessions running in Notebook's kernel. This extension also creates an API which sends live status of all Ganga Jobs. For SWAN another handler is created in server extension which renders the Ganga Jobs tab in SWAN.

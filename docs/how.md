**[Final Report](index.md)** |
**[Installation](install.md)** |
**[How it Works](how.md)** |
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
    + [Job List API](#job-list-api)
    + [SWAN Handler](#swan-handler)


## Frontend Extension
A front-end extension is a JavaScript file that defines an AMD module which exposes at least a function called `load_ipython_extension`. The frontend extension used for this project have two seperate parts,

- Notebook Section: This part communicate with kernel and render the Job Info widget below the Ganga Magic Cell. It also updates the status of Job in the widget. The communication between Kernel and notebook section frontend extension is done by Jupyter's Comm API.

- Tree Section: This part communicates with Server Extension and renders the Ganga Tab in Jupyter Tree view. The Ganga Tab displays information and status of all Jobs initialized by Ganga. The frontend extension makes AJAX calls to server extension and fetches the info about Jobs.

## Kernel Extension

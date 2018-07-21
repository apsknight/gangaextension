**[Final Report](index.md)** |
**[Installation](install.md)** |
**[How it Works](how.md)** |
**[Code](https://github.com/apsknight/gangaextension)**

# Google Summer of Code 2018

# [Large-scale computing backend for Jupyter notebooks](https://summerofcode.withgoogle.com/projects/#6368971138269184)
> This project is co-mentored by [CERN-HSF](http://hepsoftwarefoundation.org) and [Imerial College, London](https://imperial.ac.uk) for [Google Summer of Code 2018](https://summerofcode.withgoogle.com/).

## Index
- [Mentors](#mentors)
- [Introduction](#introduction)
- [Features](#features)
- [Documentation](#documentation)
- [Gallery](#gallery)
- [Future Work](#future-work)
- [Useful Links](#useful-links)

## Mentors
- Ulrik Egede
- Jakub Moscicki
- Diogo Castro
- Enric Tejedor
- Ben Jones

## Introduction
Jupyter Notebook is an interactive computing environment that creates notebooks which contains computer code as well as rich text elements like equations, figures, plots, widgets and theory. Ganga is an open source iPython based interface tool to the computing grid which leverage the power of distributed computing grid and provide scientists an interface supported by a powerful backend where they can submit their computation intensive programs to Ganga as a batch job. HTCondor is a workload management system created by University of Wisconsin-Madison. It is based on High-Throughput Computing which effectively utilizes the computing power of idle computers on a network or on a computing grid and offload computing intensive tasks on the idle machines available on a network or computing grid. This project implements an extension for Jupyter Notebook and also integrate it to SWAN Notebook service which is a cloud data analysis service developed and powered by CERN. This extension easily submits and monitor computation jobs to HTCondor using Ganga toolkit inside Notebook. The frontend extension displays status of ongoing job in Notebook itself and also allow termination of ongoing jobs. The Ganga Tab in Jupyter Tree view displays information and status of all Ganga Jobs.

## Features
- Ganga Cell Magic for creating new Ganga Jobs.
- Frontend widget to show Job information and status.
- Ganga Tab to show information and status of all Ganga Jobs.

## Documentation
- [How it works](how.md)
- [Installation](installation.md)
- Code Documenation (Available in source files)

## Gallery
### Submitting Jobs

![submitting](https://camo.githubusercontent.com/25e2ec534a4f8e03424e8009cf6d429da809c158/68747470733a2f2f696d6167652e6962622e636f2f6a314238586f2f7375626d69745f6a6f622e676966)

### Killing Jobs
![killing](https://user-images.githubusercontent.com/19551774/42093416-de4dc32c-7bc9-11e8-8d90-570fec8bb7dc.gif)

### Resubmitting Failed Jobs
![resubmit](https://user-images.githubusercontent.com/19551774/42093468-09e32a40-7bca-11e8-850f-3b73d13ff2fb.gif)

### Ganga tree tab
![treetab](https://user-images.githubusercontent.com/19551774/42093699-ddd4c6ba-7bca-11e8-8212-2e05fb9ee7ce.gif)

## Future Work

- Pending Work
    + Provide option to create Job Script in notebook itself.
- Future Ideas
    + Implementing the extension for JupyterLab.

## Useful Links
- [gangaextension](https://github.com/apsknight/gangaextension) - Github Repository
- [Initial Project Idea](https://hepsoftwarefoundation.org/gsoc/2018/proposal_GangaJupyter.html)
- [Project Proposal](https://gist.github.com/apsknight/d3093d5e7bccd0351c33fe7e283aaaf2)

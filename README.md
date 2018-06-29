[![Build Status](https://travis-ci.com/apsknight/gangaextension.svg?branch=master)](https://travis-ci.com/apsknight/gangaextension)

# Ganga Jupyter Extension
> A Jupyter Extension for submitting Ganga Jobs inside Notebook.

## About
[Ganga](https://ganga.web.cern.ch/ganga/) is a toolkit to make it easy to run data analysis jobs along with managing associated data files. It provide divide to split jobs into subjobs and submit them to different backends. Ganga intergace is available as [IPython](https://ipython.org/) shell and Python API. This project provides an interface for submitting jobs inside Notebooks.

***
Submitting Job:
![submitjob](https://image.ibb.co/j1B8Xo/submit_job.gif)

Killing Job:
![cancel_job](https://user-images.githubusercontent.com/19551774/42093416-de4dc32c-7bc9-11e8-8d90-570fec8bb7dc.gif)

Resubmitting Job:
![resubmit](https://user-images.githubusercontent.com/19551774/42093468-09e32a40-7bca-11e8-850f-3b73d13ff2fb.gif)

Ganga Tree Tab:
![treetab](https://user-images.githubusercontent.com/19551774/42093699-ddd4c6ba-7bca-11e8-8212-2e05fb9ee7ce.gif)


## Installation
This project is under development. For a quick test, run following command.

```bash
docker run -it --rm -p 8888:8888 apsknight/gangaextension
```
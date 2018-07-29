**[Final Report](index.md)** |
**[Installation](install.md)** |
**[How it Works](how.md)** |
**[How to use](use.md)** |
**[Code](https://github.com/apsknight/gangaextension)**

# Gangaextension - How to use ?

Using GangaExtension you can directly submit and monitor Ganga Jobs from Jupyter Notebook/SWAN.

The notebook and Job Script used for this tutorial can be [found here](https://github.com/apsknight/gangaextension/tree/master/notebooks).

## How to create a Job ?
To submit a Job open/create a **Python2** Notebook. In this notebook, create a new cell and in the first line of this cell write `%%ganga` to indicate this cell is an IPython Ganga Magic. From the next line simply define the Job in the same way it is defined in Ganga shell.
> Note: Only a single Job can be defined per cell magic. If none or more than one Job is defined in single magic cell, an exception will be raised.

For Example: A Job definition with multiple subjobs can look like
![screenshot_2018-07-29 help_robinson](https://user-images.githubusercontent.com/19551774/43365465-f8d0ccc4-934a-11e8-97fd-d17e0c4e29a8.png)

## How to track the Job ?
After execution of this cell magic a new Job will be created.
> Note: This Job is not being monitored in Notebook's kernel, it is being monitored in a seperate Ganga session attached to Jupyter Session, so killing this notebook will not affect monitoring of submitted Ganga Job.

A widget will appear below the cell showing Job information and it will periodically update the status of Job.
> Note: Since Job is being monitored in seperate session, there may be some lag between the actual status of Job and the status visible in following widget.

![screenshot_2018-07-29 help_robinson 2](https://user-images.githubusercontent.com/19551774/43365529-bcc109f0-934b-11e8-9cf6-fbcc13bc23f7.png)

Also, a new entry corresponding to submitted Job will appear in Ganga Jobs tab. Since the Job is being monitored in Jupyter's server session, this entry will display live status of submitted Job.
![screenshot_2018-07-29 ganga jobs](https://user-images.githubusercontent.com/19551774/43365589-be646490-934c-11e8-8910-bc6ec17dbe67.png)
> Note: The submitted Job can be killed and removed from this Ganga Jobs Tab.

## How to find Job output ?
The Job directory location can be identified by `outputdir` property of job object:
![screenshot_2018-07-29 help_robinson 3](https://user-images.githubusercontent.com/19551774/43365683-0b57e028-934e-11e8-9565-0ef037f5c5de.png)
The output files of Job can be identified by `outputfiles` property of job object:
![screenshot_2018-07-29 help_robinson 4](https://user-images.githubusercontent.com/19551774/43365695-24eb8ba2-934e-11e8-9d2e-98d33bc2bd22.png)

In this example, the content of outputfile `islands.txt` of Job is:
![screenshot_2018-07-29 help_robinson 5](https://user-images.githubusercontent.com/19551774/43365700-426e0466-934e-11e8-8bc7-59cafd61d790.png)

## How to access Job defined in different session ?
On restarting Notebook or in another notebook, The Job object can be obtained by Ganga Repository object `jobs`.
![screenshot_2018-07-29 help_robinson 6](https://user-images.githubusercontent.com/19551774/43365831-7f5f774a-9350-11e8-9170-e72bdadba256.png)


## Precaution

Since, the Ganga Namespace is directly imported in Notebook's Python namespace, user is advised to not define variables/methods with following names to prevent overwriting of Ganga Namespace variables/methods.

- ARC
- AfsToken
- ArgSplitter
- Batch
- CREAM
- Condor
- CondorRequirements
- ConfigError
- CoreTask
- CoreTransform
- CoreUnit
- CustomChecker
- CustomMerger
- Dataset
- EmptyDataset
- Executable
- File
- FileChecker
- GangaAttributeError
- GangaDataset
- GangaDatasetSplitter
- GangaList
- GenericSplitter
- GoogleFile
- GridFileIndex
- GridSandboxCache
- GridftpFileIndex
- GridftpSandboxCache
- ITask
- Interactive
- Job
- JobError
- JobInfo
- JobTime
- LCG
- LCGFileIndex
- LCGRequirements
- LCGSEFile
- LCGSandboxCache
- LSF
- Local
- LocalFile
- Localhost
- MassStorageFile
- MetadataDict
- MultiPostProcessor
- Notebook
- Notifier
- PBS
- ProtectedAttributeError
- ReadOnlyObjectError
- Remote
- Root
- RootFileChecker
- RootMerger
- SGE
- SandboxFile
- ShareDir
- ShareRef
- SharedFile
- Slurm
- SmartMerger
- TaskChainInput
- TaskLocalCopy
- TextMerger
- TreeError
- VomsProxy
- box
- categoryname
- config
- convert_merger_to_postprocessor
- credential_store
- disableMonitoring
- disableServices
- enableMonitoring
- export
- full_print
- ganga
- jobSlice
- jobs
- jobtree
- license
- load
- os
- plugins
- prep
- pth
- queues
- reactivate
- report
- reloadJob
- runMonitoring
- shareref
- sys
- tasks
- templates
- typename

## Other Useful Links
- [Ganga Docs](http://ganga.readthedocs.io/en/latest/) - Official Ganga Documentaion
- [Ganga Tutorial](https://twiki.cern.ch/twiki/bin/view/LHCb/GangaTutorial1) - Ganga Tutorial on twiki.
- [Ganga FAQ](https://twiki.cern.ch/twiki/bin/view/LHCb/FAQ/GangaLHCbFAQ) - Frequently asked questions related to Ganga.
- [Ganga Talk](https://www.youtube.com/watch?v=SSdluuVNU3Y)
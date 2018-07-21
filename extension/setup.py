#!/usr/bin/env python

from setuptools import setup, find_packages

with open('VERSION') as version_file:
    version = version_file.read().strip()

setup(name='gangaextension',
      version=version,
      description='Ganga Extension for Jupyter Notebook',
      author='Aman Pratap Singh',
      author_email='amanprtpsingh@gmail.com',
      url='https://github.com/apsknight/gangaextension',
      include_package_data=True,
      packages=find_packages(),
      zip_safe=False,
      )

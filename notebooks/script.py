#!/usr/bin/env python

import requests
import re, os, sys

urls = sys.argv[1:]

for url in urls:
    req = requests.get(url)
    text = req.text

    word1 = 'island'
    word2 = 'islands'

    count1 = sum(1 for found in re.finditer(r'\b%s\b' % word1, text, re.I))
    count2 = sum(1 for found in re.finditer(r'\b%s\b' % word2, text, re.I))

    f = open('islands.txt', 'a')
    f.write('{} {} {} {} {} \n'.format(url, word1, count1, word2, count2))
    f.close()
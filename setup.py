#!/usr/bin/env python

# This should not install the JavaScript files - that's a seperate step.

from distutils.core import setup

setup(
	name='Coreweb',
	version='10.2.23',
	description="Coreweb",
	packages=['cwtools', 'cwtools.test', 'twisted.plugins'],
	package_data={'cwtools': ['*.html', 'testres/*', 'exp/*'],},
)

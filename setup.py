#!/usr/bin/env python

# This should not install the JavaScript files - that's a seperate step.

from distutils.core import setup

import cwtools

setup(
	name='Coreweb',
	version=cwtools.__version__,
	description="Coreweb",
	packages=['cwtools', 'twisted.plugins', 'js_coreweb'],
	package_data={
		'cwtools': ['*.html', 'testres/*', 'exp/*.html', 'exp/*.swf', 'exp/spinner_behavior/*'],
		'js_coreweb': ['*.js', '*/*.js', '*/*/*.js'],
	},
)

#!/usr/bin/env python

# This should not install the JavaScript files - that's a seperate step.

from distutils.core import setup

import coreweb

setup(
	name='Coreweb',
	version=coreweb.__version__,
	description="Coreweb",
	packages=['coreweb', 'twisted.plugins', 'js_coreweb'],
	package_data={
		'coreweb': ['*.html', 'testres/*', 'exp/*.html', 'exp/*.swf', 'exp/spinner_behavior/*'],
		'js_coreweb': ['*.js', '*/*.js', '*/*/*.js'],
	},
)

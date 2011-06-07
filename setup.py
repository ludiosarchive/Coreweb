#!/usr/bin/env python

from distutils.core import setup

import coreweb

setup(
	name='Coreweb',
	version=coreweb.__version__,
	description=("JavaScript tools built on Closure Library: test runner "
		"with Deferred support, Python-like repr and eq, cross-tab "
		"communication, much more"),
	url="https://github.com/ludios/Coreweb",
	author="Ivan Kozik",
	author_email="ivan@ludios.org",
	classifiers=[
		'Programming Language :: JavaScript',
		'Programming Language :: Python :: 2',
		'Development Status :: 3 - Alpha',
		'Operating System :: OS Independent',
		'Intended Audience :: Developers',
		'Topic :: Internet :: WWW/HTTP',
		'License :: OSI Approved :: Apache Software License',
	],
	packages=['coreweb', 'twisted.plugins', 'js_coreweb'],
	package_data={
		'coreweb': ['*.html', 'testres/*', 'exp/*.html', 'exp/*.swf', 'exp/spinner_behavior/*'],
		'js_coreweb': ['*.js', '*/*.js', '*/*/*.js'],
	},
)

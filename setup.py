#!/usr/bin/env python

from distutils.core import setup

import coreweb

# When pip installs anything from packages, py_modules, or ext_modules that
# includes a twistd plugin (which are installed to twisted/plugins/),
# setuptools/distribute writes a Package.egg-info/top_level.txt that includes
# "twisted".  If you later uninstall Package with `pip uninstall Package`,
# pip removes all of twisted/ instead of just Package's twistd plugins.  See
# https://github.com/pypa/pip/issues/355
#
# To work around this problem, we monkeypatch
# setuptools.command.egg_info.write_toplevel_names to not write the line
# "twisted".  This fixes the behavior of `pip uninstall Package`.  Note that
# even with this workaround, `pip uninstall Package` still correctly uninstalls
# Package's twistd plugins from twisted/plugins/, since pip also uses
# Package.egg-info/installed-files.txt to determine what to uninstall,
# and the paths to the plugin files are indeed listed in installed-files.txt.
try:
	from setuptools.command import egg_info
	egg_info.write_toplevel_names
except (ImportError, AttributeError):
	pass
else:
	def _top_level_package(name):
		return name.split('.', 1)[0]

	def _hacked_write_toplevel_names(cmd, basename, filename):
		pkgs = dict.fromkeys(
			[_top_level_package(k)
				for k in cmd.distribution.iter_distribution_names()
				if _top_level_package(k) != "twisted"
			]
		)
		cmd.write_file("top-level names", filename, '\n'.join(pkgs) + '\n')

	egg_info.write_toplevel_names = _hacked_write_toplevel_names


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
	install_requires=[
		 'Twisted >= 8.2.0'
		,'Webmagic >= 11.6.20.1'
	],
)


try:
	from twisted.plugin import IPlugin, getPlugins
except ImportError:
	pass
else:
	list(getPlugins(IPlugin))

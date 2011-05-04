from __future__ import with_statement

import os
import jinja2

try:
	import simplejson as json
except ImportError:
	import json

from twisted.python.filepath import FilePath
from twisted.web import resource



def _extractOneArgFromFuncall(line, prefix):
	"""
	Sample usage:

	>>> _extractOneArgFromFuncall('goog.provide("test one")', 'goog.provide')
	'test one'

	>>> _extractOneArgFromFuncall("goog.provide('test one')", 'goog.provide')
	'test one'
	"""
	assert not '(' in prefix, prefix
	# len(prefix) + 1 because C{prefix} doesn't include the "("
	quotedString = line[len(prefix) + 1:line.index(')')]
	# JSON strings are always double-quoted, never single-quoted; so, fix them if needed.
	if quotedString[0] == "'" and quotedString[-1] == "'":
		quotedString = '"' + quotedString[1:-1] + '"'
	provide = json.loads(quotedString)
	return provide


def getFirstProvideLine(fp):
	with open(fp.path, 'rb') as f:
		for line in f:
			if line.startswith("goog.provide("):
				return _extractOneArgFromFuncall(line, 'goog.provide')


class TestPage(resource.Resource):
	"""
	This is a Resource that generates pages that run cw.UnitTest-based tests.

	For example:

		JSPATH = FilePath(os.environ['JSPATH'])

		self.putChild('@tests', TestPage(['cw.Test'], JSPATH))
		testres_Coreweb = FilePath(cwtools.__path__[0]).child('testres').path
		self.putChild('@testres_Coreweb', static.File(testres_Coreweb))

	"""
	isLeaf = True

	# C{testPackages} is a sequence of strings, which represent JavaScript packages or modules.

	def __init__(self, testPackages, JSPATH):
		self.testPackages = testPackages
		self.JSPATH = JSPATH


	def render_GET(self, request):
		# Comment below is half wrong: client doesn't help ?only= work yet.
		
		# Both the client and server are responsible for making ?only= work.
		# The server sends less code down the wire, which is great because
		# you will know if your '// import X' imports are incomplete.
		# The client should make sure each test module/class/method it runs
		# is a child of `only'.

		# Note that unless restrictions are added to this feature, anyone
		# who can visit the test page can download any JavaScript module in JSPATH.

		if request.args.get('only'):
			modules = request.args['only'][0].split(',')
		else:
			modules = []
			for p in self.testPackages:
				directory = self.JSPATH.preauthChild(p.replace('.', '/'))
				# TODO: make this descend Test packages, too (imitate Twisted Trial)
				testFiles = directory.globChildren('Test*')
				for tf in testFiles:
					provideLine = getFirstProvideLine(tf)
					modules.append(provideLine)

		# ...but don't run the tests on the dependency modules
		moduleString = json.dumps(modules)

		template = FilePath(__file__).sibling('TestRunnerPage.html').getContent().decode('utf-8')
		dictionary = dict(
			moduleString=moduleString,
			pageTitle=','.join(self.testPackages))
		rendered = jinja2.Environment().from_string(template).render(dictionary)
		return rendered.encode('utf-8')

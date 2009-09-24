#!/usr/local/bin/python
"""
Run a test suite and output results to stdout.
"""

from cwtools import testing
from twisted.internet import reactor, error
from twisted.python import log, filepath
import tempfile
import sys
import os
log.startLogging(sys.stdout)


def makeScriptForNode():
	theTests = testing._getTests(sys.argv[1:])
	scriptContent = testing._getScriptContent(theTests, 'process') # rargh Node.js
	moduleString = testing._getModuleListString(theTests)
	runCode = u"""
CW.msg('Running tests.');

var modules = %s;
var suite = CW.UnitTest.loadFromModules(modules);

var d = CW.UnitTest.runConsole(suite);
d.addCallback(function(){});
""" % (moduleString,)

	# Node will exit automatically when all timeouts/intervals are done.
	# Do not call node.exit(code) when the tests are done. One reason we're using
	# Node.js is to make sure that all timeouts and intervals are cleared after a
	# test suite finishes.

	return scriptContent + runCode



def run():
	bytes = makeScriptForNode().encode('utf-8')
	temp = tempfile.NamedTemporaryFile(mode='wb', delete=False)
	temp.write(bytes)
	temp.flush()
	temp.close()
	print temp.name

	#os.system(os.environ['NODE_BIN'] + ' ' + temp.name)

	#os.unlink(temp.name)

	try:
		reactor.stop()
	except error.ReactorNotRunning:
		pass


if __name__ == '__main__':
	reactor.callWhenRunning(run)
	reactor.run()

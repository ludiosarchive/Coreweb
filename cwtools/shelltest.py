#!/usr/local/bin/python
"""
Run a test suite and output results to stdout.
"""

from cwtools import jsimp, testing
from twisted.internet import reactor, error, utils, defer
from twisted.python import log
from twisted.python.filepath import FilePath
import tempfile
import sys
import os
log.startLogging(sys.stdout)


def makeScriptForNode():
	JSPATH = FilePath(os.environ['JSPATH'])
	directoryScan = jsimp.DirectoryScan(JSPATH)
	theTests = testing._getTests(sys.argv[1:], JSPATH, directoryScan)
	scriptContent = testing._getScriptContent(theTests, 'process') # rargh Node.js
	moduleString = testing._getModuleListString(theTests)
	runCode = u"""
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



@defer.inlineCallbacks
def run():
	bytes = makeScriptForNode().encode('utf-8')
	scriptFile = tempfile.NamedTemporaryFile(mode='wb', delete=False)
	scriptFile.write(bytes)
	scriptFile.flush()
	scriptFile.close()

	logFile = tempfile.NamedTemporaryFile(mode='wb', delete=False)
	logFile.close()

	log.msg('Running %s' % (scriptFile.name,))
	log.msg('Log file is %s' % (logFile.name,))

	env = {}
	env['HOME'] = '/tmp/not-a-real-home' # rargh Node.js needs this
	env['UNITTEST_LOGFILE'] = logFile.name

	out = yield utils.getProcessOutput(
		os.environ['NODE_BIN'],
		args=(scriptFile.name,),
		env=env,
		errortoo=True,
		reactor=reactor)

	sys.stdout.write(out)

	log.msg('Ran %s' % (scriptFile.name,))
	log.msg('Log file was %s' % (logFile.name,))

	#os.unlink(scriptFile.name)

	try:
		reactor.stop()
	except error.ReactorNotRunning:
		pass


if __name__ == '__main__':
	reactor.callWhenRunning(run)
	reactor.run()

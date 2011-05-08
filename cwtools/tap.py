import os

from twisted.web import server
from twisted.python import usage, log
from twisted.application import service, strports
from twisted.python.filepath import FilePath

from cwtools import corewebsite


class Options(usage.Options):
	"""
	Define the options accepted by the I{twistd cwrun} plugin.
	"""
	synopsis = "[cwrun options]"

	optParameters = [
		["servera", "a", None,
			"strports description for the server. "
			"Example: 'tcp:80:interface=127.0.0.1'. "
			"See twisted.application.strports for more examples."],
		["serverb", "b", None,
			"strports description for an optional second server."],
		["closure-library", "c", "../closure-library",
			'Path to closure-library'],
	]

	optFlags = [
		["notracebacks", "n", "Don't display tracebacks in broken web pages."],
	]

	longdesc = """corewebsite server"""



def makeService(config):
	from twisted.internet import reactor, task

	s = service.MultiService()

	site = corewebsite.makeSite(
		reactor, FilePath(config['closure-library']))
	site.displayTracebacks = not config["notracebacks"]

	if not config['servera']:
		raise ValueError("servera option is required.")

	servera = strports.service(config['servera'], site)
	servera.setServiceParent(s)

	if config['serverb']:
		serverb = strports.service(config['serverb'], site)
		serverb.setServiceParent(s)

	doReloading = bool(int(os.environ.get('PYRELOADING')))
	if doReloading:
		print 'Enabling reloader.'
		from pyquitter import detector

		stopper = detector.ChangeDetector(
			lambda: reactor.callWhenRunning(reactor.stop),
			logCallable=log.msg)

		looping = task.LoopingCall(stopper.poll)
		looping.start(2.5, now=True)

	return s

import os

from twisted.python import usage, log
from twisted.application import service, strports
from twisted.python.filepath import FilePath

from coreweb import coreweb_site


class Options(usage.Options):
	"""
	Define the options accepted by the I{twistd coreweb_site} plugin.
	"""
	synopsis = "[coreweb_site options]"

	optParameters = [
		["http", "h", None,
			"strports description for the HTTP server. "
			"Example: 'tcp:80:interface=127.0.0.1'. "
			"Repeat this option for multiple servers."],

		["closure-library", "c", "../closure-library",
			'Path to closure-library'],
	]

	optFlags = [
		["notracebacks", "n", "Don't display tracebacks in broken web pages."],
	]

	longdesc = """\
This starts the Coreweb test server (coreweb_site), from which you can
run the client-side unit tests and browser experiments.

See http://twistedmatrix.com/documents/9.0.0/api/twisted.application.strports.html
or the source code for twisted.application.strports to see examples of strports
descriptions.
"""

	def __init__(self):
		usage.Options.__init__(self)
		self['http'] = []


	def opt_http(self, option):
		self['http'].append(option)



def makeService(config):
	from twisted.internet import reactor, task

	multi = service.MultiService()

	site = coreweb_site.makeSite(
		reactor, FilePath(config['closure-library']))
	site.displayTracebacks = not config["notracebacks"]

	for httpStrport in config['http']:
		httpServer = strports.service(httpStrport, site)
		httpServer.setServiceParent(multi)

	doReloading = bool(int(os.environ.get('PYRELOADING', '0')))
	if doReloading:
		print 'Enabling reloader.'
		from pyquitter import detector

		stopper = detector.ChangeDetector(
			lambda: reactor.callWhenRunning(reactor.stop),
			logCallable=log.msg)

		looping = task.LoopingCall(stopper.poll)
		looping.start(2.5, now=True)

	return multi

import os

from twisted.web import server
from twisted.python import usage
from twisted.application import service, strports

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
		["packages", "p", None,
			"comma-separated list of test packages to test"],
	]

	optFlags = [
		["notracebacks", "n", "Don't display tracebacks in broken web pages."],
	]

	longdesc = """\
This starts a Coreweb Testrun."""



def makeService(config):
	from twisted.internet import reactor

	s = service.MultiService()

	testPackages = config['packages'].split(',')
	site = corewebsite.makeSite(reactor, testPackages)
	site.displayTracebacks = not config["notracebacks"]

	if not config['servera']:
		raise ValueError("servera option is required.")

	servera = strports.service(config['servera'], site)
	servera.setServiceParent(s)

	if config['serverb']:
		serverb = strports.service(config['serverb'], site)
		serverb.setServiceParent(s)

	return s


if os.environ.get('PYRELOADING'):
	print 'Enabling reloader.'
	from pypycpyo import detector
	makeService = detector.reloadingService(1.5)(makeService)

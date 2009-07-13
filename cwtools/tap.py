import os

from twisted.web import server
from twisted.python import usage
from twisted.application import service, strports

from cwtools import runner


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
	]

	optFlags = [
		["notracebacks", "n", "Don't display tracebacks in broken web pages."],
	]

	longdesc = """\
This starts a Coreweb Testrun."""



def makeService(config):
	s = service.MultiService()

	root = runner.Index()

	site = server.Site(root)
	site.displayTracebacks = not config["notracebacks"]

	if not config['servera']:
		raise ValueError("servera option is required.")

	servera = strports.service(config['servera'], site)
	servera.setServiceParent(s)

	if config['serverb']:
		serverb = strports.service(config['serverb'], site)
		serverb.setServiceParent(s)

	return s

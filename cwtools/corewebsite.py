import os
import cgi
import time

from twisted.web import resource
from twisted.python.filepath import FilePath

import cwtools
from cwtools import testing, htmltools
from lytics.endpoint import Analytics
from webmagic.untwist import BetterResource, BetterFile, ConnectionTrackingSite

here = FilePath(cwtools.__path__[0])


class Compiler(BetterResource):
	isLeaf = True

	def __init__(self, reactor, JSPATH):
		self._reactor = reactor
		self.JSPATH = JSPATH


	def render_GET(self, request):
		ewFile = here.child('compiled').child('_Compilables.js.ew')
		ewContent = ewFile.getContent()
		# We assume filesystem timestamps closely match reality.
		age = time.time() - ewFile.getModificationTime()
		return '''\
<!doctype html>
<head>
	<title>_Compilables.js warnings and errors</title>
	<style>
		html, body { background-color: #d4d0c8; }
	</style>
</head>
<body>
_Compilables was last compiled %.1f second(s) ago.
<ul>
	<li><a href="/compiled/_Compilables.js">output file</a></li>
	<li><a href="/compiled/_Compilables.js.log">log file</a></li>
</ul>
Errors and warnings from Closure Compiler:<br>
<pre>%s</pre>
</body>
</html>
''' % (age, cgi.escape(ewContent),)



class CachedFile(BetterFile):
	isLeaf = True

	def render_GET(self, request):
		request.responseHeaders.setRawHeaders('Expires', ['Sat, 30 Dec 2034 16:00:00 GMT'])
		request.responseHeaders.setRawHeaders('Cache-Control', ['max-age=99999999'])
		return BetterFile.render_GET(self, request)



class Root(BetterResource):

	def __init__(self, reactor, testPackages):

		resource.Resource.__init__(self)

		JSPATH = FilePath(os.environ['JSPATH'])

		self.putChild('', BetterFile(here.child('index.html').path))
		self.putChild('compiled', BetterFile(here.child('compiled').path))
		self.putChild('JSPATH', BetterFile(JSPATH.path))
		self.putChild('exp', htmltools.LiveBox(here.child('exp').path, JSPATH))
		self.putChild('emptyjs_cached', CachedFile(here.child('exp').child('empty.js').path, JSPATH))
		self.putChild('compiler', Compiler(reactor, JSPATH))
		self.putChild('analytics', Analytics(clock=reactor, fsw=None)) # No need for fsw, but this breaks analytics/s/
		self.putChild('@tests', testing.TestPage(testPackages, JSPATH))

		testres_Coreweb = here.child('testres').path
		self.putChild('@testres_Coreweb', BetterFile(testres_Coreweb))



def makeSite(reactor, testPackages):
	root = Root(reactor, testPackages)
	site = ConnectionTrackingSite(root, clock=reactor)
	return site

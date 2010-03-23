import os
import cgi
import tempfile

from twisted.web import resource, static, server
from twisted.python.filepath import FilePath

from cwtools import testing, htmltools, jsimp
from ecmaster import closurecompiler


class Compiler(resource.Resource):
	isLeaf = True

	def __init__(self, reactor, JSPATH):
		self._reactor = reactor
		self.JSPATH = JSPATH


	def render_GET(self, request):
		o = tempfile.mkstemp(suffix='.js', prefix='_Compilables')
		outputFile = FilePath(o[1])

		d = closurecompiler.advancedCompile(
			self._reactor, self.JSPATH.child('_Compilables.js'), self.JSPATH, outputFile, {})

		def write(output):
			# TODO: only write if not aborted already
			request.write('''\
Output file is:<br>
<pre>%s</pre>
Output from Closure Compiler:<br>
<pre>%s</pre>
''' % (cgi.escape(outputFile.path), cgi.escape(output),))
			request.finish()

		d.addCallback(write)

		return server.NOT_DONE_YET



class Root(resource.Resource):

	def __init__(self, reactor, testPackages):
		import cwtools
		
		resource.Resource.__init__(self)

		here = FilePath(cwtools.__path__[0])

		JSPATH = FilePath(os.environ['JSPATH'])
		directoryScan = jsimp.DirectoryScan(JSPATH)

		self.putChild('', static.File(here.child('index.html').path))
		self.putChild('exp', htmltools.LiveBox(here.child('exp').path, JSPATH, directoryScan))
		self.putChild('compiler', Compiler(reactor, JSPATH))
		self.putChild('@tests', testing.TestPage(testPackages, directoryScan))

		testres_Coreweb = here.child('testres').path
		self.putChild('@testres_Coreweb', static.File(testres_Coreweb))



def makeSite(reactor, testPackages):
	root = Root(reactor, testPackages)
	site = server.Site(root, clock=reactor)
	return site

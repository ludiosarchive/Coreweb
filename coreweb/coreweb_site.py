from twisted.web import resource
from twisted.python.filepath import FilePath

from webmagic.untwist import BetterResource, BetterFile, ConnectionTrackingSite
from webmagic.special import WaitResource

import coreweb
here = FilePath(coreweb.__path__[0])



class CachedFile(BetterFile):
	isLeaf = True

	def render_GET(self, request):
		request.responseHeaders.setRawHeaders('Expires', ['Sat, 30 Dec 2034 16:00:00 GMT'])
		request.responseHeaders.setRawHeaders('Cache-Control', ['max-age=99999999'])
		return BetterFile.render_GET(self, request)



class Root(BetterResource):

	def __init__(self, reactor, closureLibrary):
		import js_coreweb

		resource.Resource.__init__(self)

		self.putChild('', BetterFile(here.child('index.html').path))
		self.putChild('js_coreweb_tests.html', BetterFile(here.child('js_coreweb_tests.html').path))
		self.putChild('compiled', BetterFile(here.child('compiled').path))
		self.putChild('closure-library', BetterFile(closureLibrary.path))
		self.putChild('js_coreweb', BetterFile(FilePath(js_coreweb.__file__).parent().path))
		self.putChild('exp', BetterFile(here.child('exp').path))
		self.putChild('emptyjs_cached', CachedFile(here.child('exp').child('empty.js').path))
		self.putChild('wait_resource', WaitResource(clock=reactor))

		testres_Coreweb = here.child('testres').path
		self.putChild('@testres_Coreweb', BetterFile(testres_Coreweb))



def makeSite(reactor, closureLibrary):
	root = Root(reactor, closureLibrary)
	site = ConnectionTrackingSite(root, timeout=75)
	return site

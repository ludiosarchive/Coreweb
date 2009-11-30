from twisted.web import resource, static, server
from twisted.python.filepath import FilePath

from cwtools import testing


class CustomTestPage(testing.TestPage):

	def __init__(self, testPackages):
		self.testPackages = testPackages



class Root(resource.Resource):

	def __init__(self, testPackages):
		import cwtools
		
		resource.Resource.__init__(self)

		here = FilePath(cwtools.__path__[0])

		self.putChild('', static.File(here.child('index.html').path))
		self.putChild('exp', static.File(here.child('exp').path))
		self.putChild('@tests', CustomTestPage(testPackages))

		testres_Coreweb = here.child('testres').path
		self.putChild('@testres_Coreweb', static.File(testres_Coreweb))



def makeSite(reactor, testPackages):
	root = Root(testPackages)
	site = server.Site(root, clock=reactor)
	return site

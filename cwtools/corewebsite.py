from twisted.web import resource, static, server
from twisted.python.filepath import FilePath

from cwtools import testing


class CustomTestPage(testing.TestPage):

	def __init__(self, testPackages):
		self.testPackages = testPackages



class Index(resource.Resource):
	isLeaf = True

	def render_GET(self, request):
		page = """
<!doctype html>
<html>
<head>
<title>corewebsite</title>
</head>
<body>
<ul>
<li><a href="/@tests/">CW.Test tests</a>
<li><a href="/exp/">Browser experiments</a>
</ul>
</body>
</html>
		"""
		return page




class Root(resource.Resource):

	def __init__(self, testPackages):
		import cwtools
		
		resource.Resource.__init__(self)

		self.putChild('', Index())
		expDirectory = FilePath(cwtools.__path__[0]).child('exp').path
		self.putChild('exp', static.File(expDirectory))
		self.putChild('@tests', CustomTestPage(testPackages))

		testres_Coreweb = FilePath(cwtools.__path__[0]).child('testres').path
		self.putChild('@testres_Coreweb', static.File(testres_Coreweb))



def makeSite(reactor, testPackages):
	root = Root(testPackages)
	site = server.Site(root, clock=reactor)
	return site

from twisted.web import resource, static
from twisted.python.filepath import FilePath

from cwtools import testing


class CustomTestPage(testing.TestPage):

	def __init__(self, testPackages):
		self.testPackages = testPackages



class Index(resource.Resource):

	def __init__(self, testPackages):
		import cwtools
		
		resource.Resource.__init__(self)

		self.putChild('@tests', CustomTestPage(testPackages))

		testres_Coreweb = FilePath(cwtools.__path__[0]).child('testres').path
		self.putChild('@testres_Coreweb', static.File(testres_Coreweb))

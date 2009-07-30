import os
from twisted.python.filepath import FilePath
from twisted.web import resource, static

from cwtools import jsimp


class TestPage(resource.Resource):
	"""
	This is a Resource that generates pages that run CW.UnitTest-based tests.

	To use it, subclass it and set testPackage to the JS package with the tests.

	For example:
		
		class CWTestPage(testing.TestPage):
			testPackage = 'CW.Test'

		[...]

		self.putChild('@tests', CWTestPage())
		self.putChild('@js', static.File(os.environ['JSPATH']))

	"""
	isLeaf = True
	testPackage = None # your subclass should define this

	def _getTests(self):
		JSPATH = FilePath(os.environ['JSPATH'])
		tests = [jsimp.Script(self.testPackage, JSPATH, '/@js/')]
		# TODO: make this descend Test packages, too (imitate Twisted Trial)
		tests.extend(jsimp.Script(self.testPackage, JSPATH, '/@js/').globChildren('Test*'))
		return tests


	def render_GET(self, request):
		theTests = self._getTests()

		scriptContent = jsimp.megaScript(jsimp.getDepsMany(theTests), wrapper=True)

		# ...but don't run the tests on the dependency modules
		moduleList = []
		for t in theTests:
			moduleList.append(t.getName())
		moduleString = '[' + ','.join(moduleList) + ']'

		jsw = jsimp.JavaScriptWriter()
		testsTemplate = FilePath(__file__).parent().child('tests.html').getContent()
		return jsw.render(testsTemplate,
			dict(scriptContent=scriptContent, moduleString=moduleString)).encode('utf-8')

import os
from twisted.python.filepath import FilePath
from twisted.web import resource

from cwtools import jsimp


class TestPage(resource.Resource):
	"""
	This is a Resource that generates pages that run CW.UnitTest-based tests.

	To use it, subclass it and set testPackages to a list of JS packages with tests.

	For example:
		
		class TestPage(testing.TestPage):
			testPackages = ['CW.Test']

		[...]

		self.putChild('@tests', TestPage())
		testres_Coreweb = FilePath(cwtools.__path__[0]).child('testres').path
		self.putChild('@testres_Coreweb', static.File(testres_Coreweb))

	"""
	isLeaf = True

	# C{testPackages} is a sequence of strings, which represent JavaScript packages or modules.
	testPackages = None # your subclass should define this

	def _getTests(self, packages):
		JSPATH = FilePath(os.environ['JSPATH'])
		tests = []
		for package in packages:
			tests.append(jsimp.Script(package, JSPATH, '/@js/'))
			# TODO: make this descend Test packages, too (imitate Twisted Trial)
			tests.extend(jsimp.Script(package, JSPATH, '/@js/').globChildren('Test*'))
		return tests


	def render_GET(self, request):
		# Both the client and server are responsible for making ?only= work.
		# The server sends less code down the wire, which is great because
		# you will know if your '// import X' imports are incomplete.
		# The client should make sure each test module/class/method it runs
		# is a child of `only'.

		# Note that unless restrictions are added to this feature, anyone
		# who can visit the test page can download any JavaScript module in JSPATH.

		if request.args.get('only'):
			theTests = self._getTests(request.args['only'][0].split(','))
		else:
			theTests = self._getTests(self.testPackages)


		# TODO: only serve the wrapper to JScript browsers (or, feature-test for the leaking)

		scriptContent = jsimp.megaScript(
			jsimp.getDepsMany(theTests),
			wrapper=True,
			dictionary=dict(_debugMode=True))

		# ...but don't run the tests on the dependency modules
		moduleList = []
		for t in theTests:
			moduleList.append(t.getName())
		moduleString = '[' + ','.join(moduleList) + ']'

		jsw = jsimp.JavaScriptWriter()
		testsTemplate = FilePath(__file__).parent().child('tests.html').getContent()
		return jsw.render(
			testsTemplate,
			dict(scriptContent=scriptContent,
				moduleString=moduleString,
				pageTitle=','.join(self.testPackages))
			).encode('utf-8')

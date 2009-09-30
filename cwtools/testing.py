import os
from twisted.python.filepath import FilePath
from twisted.web import resource

from cwtools import jsimp


def _getTests(packages):
	"""
	C{packages} is a list of strings representing JavaScript package names.

	@return: a list of L{Script}s.
	"""
	JSPATH = FilePath(os.environ['JSPATH'])
	tests = []
	for package in packages:
		tests.append(jsimp.Script(package, JSPATH))
		# TODO: make this descend Test packages, too (imitate Twisted Trial)
		tests.extend(jsimp.Script(package, JSPATH).globChildren('Test*'))
	return tests



def _getScriptContent(tests, globalObjectName):
	scriptContent = jsimp.megaScript(
		jsimp.getDepsMany(tests),
		wrapper=True,
		dictionary=dict(_debugMode=True),
		globalObjectName=globalObjectName)
	return scriptContent



def _getModuleListString(tests):
	moduleList = []
	for t in tests:
		moduleList.append(t.getName())
	moduleString = '[' + ','.join(moduleList) + ']'
	return moduleString



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

	def render_GET(self, request):
		# Both the client and server are responsible for making ?only= work.
		# The server sends less code down the wire, which is great because
		# you will know if your '// import X' imports are incomplete.
		# The client should make sure each test module/class/method it runs
		# is a child of `only'.

		# Note that unless restrictions are added to this feature, anyone
		# who can visit the test page can download any JavaScript module in JSPATH.

		if request.args.get('only'):
			theTests = _getTests(request.args['only'][0].split(','))
		else:
			theTests = _getTests(self.testPackages)


		# TODO: only serve the wrapper to JScript browsers (or, feature-test for the leaking)
		# `Node' also needs the wrapper because our code assumes the global object is `window',
		# and the wrapper fixes that.

		scriptContent = _getScriptContent(theTests, 'window')

		# ...but don't run the tests on the dependency modules
		moduleString = _getModuleListString(theTests)

		jsw = jsimp.JavaScriptWriter()
		testsTemplate = FilePath(__file__).parent().child('tests.html').getContent()
		return jsw.render(
			testsTemplate,
			dict(scriptContent=scriptContent,
				moduleString=moduleString,
				pageTitle=','.join(self.testPackages))
			).encode('utf-8')

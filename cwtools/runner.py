"""
The goal is to be able to do:

twistd cwtest CW.Test
or
twistd cwtest CW.Test,CW.Next.Test

and have this launch both an HTTP and HTTPS server
"""

import os
from jinja2 import Template
from twisted.python.filepath import FilePath
from twisted.web import resource, static

from cwtools import jsimp


def neverEverCache(request):
	"""
	Set headers to indicate that the response to this request should never,
	ever be cached.

	If neverEverCache is used on a request, Internet Explorer cannot load the swf or
	other embedded plugin content on the page.
	See http://kb.adobe.com/selfservice/viewContent.do?externalId=fdc7b5c&sliceId=1
	See http://support.microsoft.com/kb/812935

	(from Athena)
	"""
	request.responseHeaders.setRawHeaders('expires', []) # remove 'expires' headers.

	# no-transform may convince some proxies not to screw with the request
	# http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.9.5
	request.setHeader('cache-control', 'no-store, no-cache, no-transform, must-revalidate')
	request.setHeader('pragma', 'no-cache')


class CommonStatic(resource.Resource):
	isLeaf = True

	def render_GET(self, request):
		if request.uri.endswith('/blank/'):
			return ' '


class TestPage(resource.Resource):
	isLeaf = True

	def _getTests(self):
		JSPATH = FilePath(os.environ['JSPATH'])
		tests = [jsimp.Script('CW.Test', JSPATH, '/@js/')]
		tests.extend(jsimp.Script('CW.Test', JSPATH, '/@js/').globChildren('Test*'))
		return tests


	def render_GET(self, request):
		#request.setHeader('content-type', 'text/plain')

		scripts = ''

		modlist = []

		# We need the script data for all the dependencies and the test modules
		for t in jsimp.getDepsMany(self._getTests()):
			scripts += t.scriptSrc()

		# ...but don't run the tests on the dependency modules
		for t in self._getTests():
			modlist.append(t.getName())

		modules = '[' + ','.join(modlist) + ']'

		jsw = jsimp.JavaScriptWriter()
		testsTemplate = FilePath(__file__).parent().child('tests.html').getContent()
		return jsw.render(testsTemplate, dict(scripts=scripts, modules=modules)).encode('utf-8')


class Index(resource.Resource):

	def __init__(self):
		resource.Resource.__init__(self)

		self.putChild('@tests', TestPage())
		self.putChild('@static', CommonStatic())
		self.putChild('@js', static.File(os.environ['JSPATH']))

"""
The goal is to be able to do:

twistd cwtest CW.Test
or
twistd cwtest CW.Test,CW.Next.Test

and have this launch both an HTTP and HTTPS server
"""

from jinja2 import Template
from twisted.python import FilePath
from twisted.web import resource


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


class TestPage(resource.Resource):
	isLeaf = True

	def render_GET(self, request):
		#request.setHeader('content-type', 'text/plain')
		testsTemplate = FilePath(__file__).parent().child('tests.html')
		return Template(
			open(testsTemplate, 'rb').read()
		).render(tagsFor=tagsFor).encode('utf-8')


class Index(resource.Resource):

	def __init__(self):
		resource.Resource.__init__(self)

		self.putChild('@tests', TestPage())

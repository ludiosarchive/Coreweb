import os
from twisted.web import resource, static
from twisted.python.filepath import FilePath

import cwtools
from cwtools import testing


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



class CWTestPage(testing.TestPage):

	def __init__(self, testPackages):
		self.testPackages = testPackages



class Index(resource.Resource):

	def __init__(self, testPackages):
		resource.Resource.__init__(self)

		self.putChild('@tests', CWTestPage(testPackages))

		testres_CW = FilePath(cwtools.__path__[0]).child('testres').path
		self.putChild('@testres_CW', static.File(testres_CW))

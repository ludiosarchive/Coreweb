import sys
import jinja2
from twisted.web import resource, static
from twisted.python.filepath import FilePath

_postImportVars = vars().keys()


def getTestPageCSS():
	"""
	Returns a stylesheet useful for all the test pages we have.
	"""
	return u'''
* {
	font-family: Verdana, sans-serif;
	font-size: 13px;
}
pre, code {
	font-family: Consolas, monospace;
	font-size: 0.8em;
}
body, html {
	background-color: #eee;
}
#log {
	white-space: pre;
}
#doc {
	white-space: pre-wrap;
}
'''


# TODO: a test would be nice
class LiveBoxPage(resource.Resource):
	"""
	Treats C{basePath}/C{fileName} as a template.
	"""
	def __init__(self, basePath, fileName, JSPATH):
		resource.Resource.__init__(self)
		self._basePath = basePath
		self._fileName = fileName
		self._JSPATH = JSPATH
		self._jinja2Env = jinja2.Environment()


	def _render(self, request):
		# This jinja2 stuff is for the html page, not the JavaScript
		template = self._basePath.child(self._fileName).getContent().decode('utf-8')
		dictionary = dict(getTestPageCSS=getTestPageCSS)
		rendered = self._jinja2Env.from_string(template).render(dictionary)
		if not rendered.endswith(u'\n'):
			rendered += u'\n'
		return rendered.encode('utf-8')


	def render_GET(self, request):
		return self._render(request)


	def render_POST(self, request):
		return self._render(request)



class LiveBox(static.File):
	"""
	This is a Resource useful for building demos that can import JavaScript.
	Files that end with .html are treated as jinja2 templates, and can use the function
	C{expandScript} to import JavaScript from C{JSPATH}. See C{livebox/demo.html}
	for an example.

	Like L{static.File}, this can serve anything. Non-C{.html} files
	will be not be processed with jinja2.
	"""
	def __init__(self, basePath, JSPATH, *args, **kwargs):
		static.File.__init__(self, basePath)
		self._basePath = FilePath(basePath)
		self._JSPATH = JSPATH


	def getChild(self, name, request):
		if self._basePath.child(name).isdir() or not name.lower().endswith('.html'):
			return static.File.getChild(self, name, request)
		else:
			return LiveBoxPage(self._basePath, name, self._JSPATH)



try:
	from mypy import refbinder
except ImportError:
	pass
else:
	refbinder.bindRecursive(sys.modules[__name__], _postImportVars)
	del refbinder

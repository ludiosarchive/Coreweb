"""
Right now, this module isn't good enough, because there's
no L{twisted.web.resource.Resource} subclass that can dynamically
serve templated-JS files.

If templated-JS files can be served individually, it might help debug
applications made of dozens of JavaScript files. Tools like Firebug
work better when JavaScript is loaded from many files.
"""

import sys
import struct
import jinja2
from webmagic import uriparse
from cwtools import jsimp
from twisted.web import resource, static
from twisted.python.filepath import FilePath

_postImportVars = vars().keys()


def cacheBreakerForPath(path):
	"""
	Create a ?cachebreaker useful for appending to a URL.

	This could really be used for anything. It's not just for JavaScript,
	and not just for development.
	"""

	# The timestamp from the filesystem may have any amount of precision.
	# Nanosecond precision (6 decimal places) on Linux has been observed.
	timestamp = path.getModificationTime()

	# Pack the timestamp (float) for slight obfuscation.
	cacheBreaker = struct.pack('<d', timestamp).encode('hex')

	return cacheBreaker


# TODO: handle higher Mozilla-only JavaScript versions. (1.6-1.8); applies to scriptSrc too
def scriptContent(script):
	"""
	Generate an HTML4/5 <script> tag with the script contents.
	"""

	template = u"<script>%s;\n%s</script>"

	return template % (script._underscoreName(), script.getContent())


def scriptSrc(script, mountedAt):
	"""
	Generate an HTML4/5 <script src="...">

	C{script} is a L{Script}
	C{mountedAt} is a relative or absolute URI,
		indicating where the root package is on the web server.
	"""

	if not isinstance(mountedAt, str):
		raise ValueError("Need a str for mountedAt; got %r" % (mountedAt,))

	template = """<script>%s</script><script src="%s?%s"></script>\n"""

	cacheBreaker = cacheBreakerForPath(script.getAbsoluteFilename())

	return template % (
		script._underscoreName(),
		uriparse.urljoin(mountedAt, script.getFilename()),
		cacheBreaker)


def expandScript(script, basePath=None, directoryScan=None):
	if basePath is None:
		import os
		if not 'JSPATH' in os.environ:
			raise RuntimeError("No basePath argument passed, and no os.environ['JSPATH']")
		from twisted.python.filepath import FilePath
		basePath=FilePath(os.environ['JSPATH'])

	v = jsimp.VirtualScript(script, basePath, forcedDeps=None, directoryScan=directoryScan)

	# copied from cwtools/testing.py

	# This try/except/rescan only handles the case where a `provide' could not be found.
	# If the name being `provide'd moved to another JavaScript file, the state will be
	# bad and the assembled JavaScript will be wrong. In this case, restarting the
	# development server is the best option.
	try:
		deps = jsimp.getDeps(v)
	except jsimp.NobodyProvidesThis:
		if directoryScan is None:
			raise
		directoryScan.rescan()
		deps = jsimp.getDeps(v)

	full = jsimp.megaScript(deps)
	return full


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

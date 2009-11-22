"""
Right now, this module isn't good enough, because there's
no L{twisted.web.resource.Resource} subclass that can dynamically
serve templated-JS files.

If templated-JS files can be served individually, it might help debug
applications made of dozens of JavaScript files. Tools like Firebug
work better when JavaScript is loaded from many files.
"""

import struct
from webmagic import uriparse
from cwtools import jsimp


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
def scriptContent(script, dictionary=None):
	"""
	Generate an HTML4/5 <script> tag with the script contents.
	"""

	template = "<script>%s;\n%s</script>"

	return template % (script._underscoreName(), script.renderContent(dictionary))


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

	full = jsimp.megaScript(deps, wrapper=False, dictionary=dict(_debugMode=True))
	return full

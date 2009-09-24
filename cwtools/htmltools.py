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


def cacheBreakerForPath(path):
	"""
	Create a ?cachebreaker useful for appending to a URL.

	This could really be used for anything. It's not just for JavaScript,
	and not just for development.
	"""

	# Timestamp from the filesystem may come in nanosecond precision (6 decimal places)
	timestamp = path.getModificationTime()

	# Pack the timestamp (float) for slight obfuscation.
	cacheBreaker = struct.pack('<d', timestamp).encode('hex')

	return cacheBreaker


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

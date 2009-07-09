import os
import struct

from twisted.python import log

basePath = os.environ.get('JSPATH', None)
if not basePath:
	log.msg("No JSPATH in env variables, program might fail very soon.")

class NoSuchJSError(Exception):
	"""
	Module/package doesn't exist, or __init__.js is missing.
	"""


def fileForPath(path):
	return os.path.join(basePath, path)


def cacheBreakerForPath(path, os=os):
	"""
	Create a ?cachebreaker useful for appending to a URL.

	This could really be used for anything. It's not just for JavaScript,
	and not just for development.
	"""

	# Timestamp from the filesystem may come in nanosecond precision (6 decimal places)
	timestamp = os.stat(path).st_mtime

	# Pack the timestamp (float) for slight obfuscation.
	cacheBreaker = struct.pack('<d', timestamp).encode('hex')

	return cacheBreaker


def pathForModule(name):
	parts = name.split('.')

	if os.path.isdir(os.path.join(basePath, '/'.join(parts))):
		full = '/'.join(parts + ['__init__.js'])
		if not os.path.exists(fileForPath(full)):
			raise NoSuchJSError("Directory for package %r exists but missing __init__.js" % (name,))
	else:
		full = '/'.join(parts) + '.js'
		if not os.path.exists(fileForPath(full)):
			raise NoSuchJSError("Tried to find %r but no such file %r" % (name, full))

	return full


def makeTags(name):
	template = """\
<script>%s = {'__name__': '%s'}</script>
<script src="/js/%s?%s"></script>"""

	full = pathForModule(name)

	cacheBreaker = cacheBreakerForPath(fileForPath(full))
	return template % (name, name, full, cacheBreaker)

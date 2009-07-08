import os
import struct

basePath = os.environ['JSPATH']

class NoSuchJSError(Exception):
	"""
	Module/package doesn't exist, or __init__.js is missing.
	"""


def cacheBreakerForPath(path):
	ondisk = os.path.join(basePath, path)

	# Timestamp from the filesystem may come in nanosecond precision (6 decimal places)
	timestamp = os.stat(ondisk).st_mtime

	# Pack the timestamp (float) for slight obfuscation.
	cacheBreaker = struct.pack('<d', timestamp).encode('hex')

	return cacheBreaker


def pathForModule(name):
	parts = name.split('.')

	if os.path.isdir(os.path.join(basePath, '/'.join(parts))):
		full = '/'.join(parts + ['__init__.js'])
		if not os.path.exists(os.path.join(basePath, full)):
			raise NoSuchJSError("Directory for package %r exists but missing __init__.js" % (name,))
	else:
		full = '/'.join(parts) + '.js'
		if not os.path.exists(os.path.join(basePath, full)):
			raise NoSuchJSError("Tried to find %r but no such file %r" % (name, full))

	return full


def makeTags(name):
	template = """\
<script>%s = {'__name__': '%s'}</script>
<script src="/js/%s?%s"></script>"""

	full = pathForModule(name)

	cacheBreaker = cacheBreakerForPath(full)
	return template % (name, name, full, cacheBreaker)

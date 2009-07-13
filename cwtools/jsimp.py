import os
import struct

from twisted.python import log

#globalBasePath = os.environ.get('JSPATH', None)
#if not globalBasePath:
#	log.msg("No JSPATH in env variables, program might fail very soon.")


class NoSuchJSError(Exception):
	"""
	Module/package doesn't exist, or __init__.js is missing.
	"""


def fileForPath(path, basePath):
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


def pathForModule(name, basePath):
	"""
	An __init__.js file is not required in a package directory.
	"""
	parts = name.split('.')

	if os.path.isdir(os.path.join(basePath, '/'.join(parts))):
		full = '/'.join(parts + ['__init__.js'])
		if not os.path.exists(fileForPath(full, basePath)):
			raise NoSuchJSError(
				"Directory for package "
				"%r exists but missing the __init__.js required for this import." % (name,))
	else:
		full = '/'.join(parts) + '.js'
		if not os.path.exists(fileForPath(full, basePath)):
			raise NoSuchJSError("Tried to find %r but no such file %r" % (name, full))

	return full


#def makeTags(name):
#	template = """\
#<script>%s = {'__name__': '%s'}</script>
#<script src="/js/%s?%s"></script>"""
#
#	full = pathForModule(name, basePath)
#
#	cacheBreaker = cacheBreakerForPath(fileForPath(full, basePath))
#	return template % (name, name, full, cacheBreaker)



def makeTags(name, basePath):
	template = """\
<script>%s={'__name__':'%s'};%s</script>"""

	full = fileForPath(pathForModule(name, basePath), basePath)
	contents = open(full, 'rb').read()

	return template % (name, name, contents)

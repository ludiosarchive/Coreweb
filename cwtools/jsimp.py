import os
import struct

from twisted.python import log

from z9.spider import uriparse # TODO XXX REFACTOR TO MODULE

#globalBasePath = os.environ.get('JSPATH', None)
#if not globalBasePath:
#	log.msg("No JSPATH in env variables, program might fail very soon.")


class NoSuchJSError(Exception):
	"""
	Module/package doesn't exist, or __init__.js is missing.
	"""


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



class Script(object):
	def __init__(self, name, basePath, mountedAt=None):
		self.name = name
		self.basePath = basePath
		self.mountedAt = mountedAt


	def getFilename(self):
		"""
		Useful for both disk access and referencing the script for a URL.

		An __init__.js file is not required in a package directory.
		"""
		parts = self.name.split('.')

		if os.path.isdir(os.path.join(self.basePath, '/'.join(parts))):
			full = '/'.join(parts + ['__init__.js'])
			if not os.path.exists(os.path.join(self.basePath, full)):
				raise NoSuchJSError(
					"Directory for package "
					"%r exists but missing the __init__.js required for this import." % (self.name,))
		else:
			full = '/'.join(parts) + '.js'
			if not os.path.exists(os.path.join(self.basePath, full)):
				raise NoSuchJSError("Tried to find %r but no such file %r" % (self.name, full))

		return full


	def getAbsoluteFilename(self):
		return os.path.join(self.basePath, self.getFilename())


	def getContent(self):
		return open(self.getAbsoluteFilename(), 'rb').read()


	def _underscoreName(self):
		"""
		Return the header required for the JS module to run.

		TODO: but only CW things require this. Should it just be in the module?
		"""
		
		return "%s={'__name__':'%s'}" % (self.name, self.name)


	def scriptContent(self):
		"""
		Generate an HTML4/5 <script> tag with the script contents.
		"""

		template = "<script>%s;%s</script>"

		return template % (self._underscoreName(), self.getContent())


	def scriptSrc(self):
		"""
		Generate an HTML4/5 <script src="...">
		"""

		template = """\
	<script>%s</script><script src="%s?%s"></script>"""

		full = pathForModule(self.name, self.basePath)
		cacheBreaker = cacheBreakerForPath(fileForPath(full, self.basePath))

		return template % (self._underscoreName(), uriparse.urljoin(mountedAt, full), cacheBreaker)

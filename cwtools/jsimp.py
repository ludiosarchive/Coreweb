import os
import struct

from twisted.python import log

from webmagic import uriparse

#globalBasePath = os.environ.get('JSPATH', None)
#if not globalBasePath:
#	log.msg("No JSPATH in env variables, program might fail very soon.")


class FindScriptError(Exception):
	"""
	Module/package doesn't exist, or __init__.js is missing.
	"""


class CircularDependencyError(Exception):
	pass
	


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



def _depTraverse(script, flat=None, depChain=None):
	"""
	DFS
	"""
	if flat is None:
		flat = []
	if depChain is None:
		depChain = [script]

	flat.append(script)
	deps = script.getDependencies()
	for dep in deps: # remember, there could be 0 deps
		if dep in depChain:
			raise CircularDependencyError(
				"There exists a circular dependency in %r's imports." % (script,))

		flat.append(dep)
		_depTraverse(dep, flat, depChain + [dep]) # ignore the return value

	return flat



def getDeps(script):
	"""
	Return the list of scripts that must be included
	for L{script} to work properly.
	"""
	final = []
	bigList = _depTraverse(script)
	bigList.reverse()
	alreadySeen = set()
	for item in bigList:
		if item not in alreadySeen:
			alreadySeen.add(item)
			final.append(item)
	return final


def getDepsMany(scripts):
	"""
	Return the list of scripts that must be included
	for L{scripts} to work properly.
	"""
	alreadySeen = set()
	returnList = []
	for script in scripts:
		deps = getDeps(script)
		for dep in deps:
			if dep not in alreadySeen:
				returnList.append(dep)
				alreadySeen.add(dep)
	return returnList


class Script(object):
	"""
	Represents a JavaScript file.

	Modifying private attributes will screw up everything.
	"""

	# TODO: use flyweight pattern on Script, and cache the dependency list.

	packageFilename = '__init__.js'
	__slots__ = ['_name', '_basePath', '_mountedAt', '__weakref__']

	def __init__(self, name, basePath, mountedAt=None):
		"""
		L{name} is the module name (examples: 'module', 'package', 'package.module')
		L{basePath} is a twisted.python.filepath.FilePath instance.
		L{mountedAt} (optional) is a relative or absolute URI,
			indicating where the root package is on the web server.
		"""
		# The __setattr__ blocks a simple `self.value = value'
		self._name = name
		self._basePath = basePath
		self._mountedAt = mountedAt


	def __eq__(self, other):
		if not isinstance(other, Script):
			return False
		return (self._name == other._name and
			self._basePath == other._basePath and
			self._mountedAt == other._mountedAt)


	def __hash__(self):
		return hash((self._name, self._basePath, self._mountedAt))


	def __repr__(self):
		return '<Script %r in %r @ %r>' % (
			self._name, self._basePath.basename(), self._mountedAt)


	def getName(self):
		return self._name


	def _isPackage(self):
		"""
		Return True is this Script is a package (A package may have children.
		The source for a package is loaded from an __init__.js)
		"""
		parts = self._name.split('.')
		return self._basePath.preauthChild('/'.join(parts)).isdir()


	def getFilename(self):
		"""
		Returns a string of the non-absolute filepath for this script.

		Useful for both disk access and referencing the script for a URL.

		An __init__.js file is not required in a package directory.
		"""
		parts = self._name.split('.')

		if self._isPackage():
			location = '/'.join(parts + [self.packageFilename])
			if not self._basePath.preauthChild(location).exists():
				raise FindScriptError(
					"Directory for package "
					"%r exists but missing the %r required for this import." % (
						self._name, self.packageFilename))
		else:
			location = '/'.join(parts) + '.js'
			if not self._basePath.preauthChild(location).exists():
				raise FindScriptError("Tried to find %r but no such file %r" % (self._name, location))

		return location


	def getAbsoluteFilename(self):
		"""
		Returns a L{t.p.f.FilePath} object representing the absolute filename of the script.
		"""
		return self._basePath.preauthChild(self.getFilename())


	def getContent(self):
		return self.getAbsoluteFilename().getContent().decode('utf-8')


	def _getImportStrings(self):
		imports = []
		for line in self.getContent().split('\n'):
			clean = line.rstrip()
			if clean.startswith('// import '):
				imports.append(clean.replace('// import ', '', 1))
			elif clean.startswith('//import '):
				imports.append(clean.replace('//import ', '', 1))
			else:
				continue

		return imports


	def getDependencies(self):
		deps = []
		for mod in self._getImportStrings():
			deps.append(Script(mod, self._basePath, self._mountedAt))
		return deps


	def globChildren(self, pattern):
		parts = self._name.split('.')

		children = []

		if not self._isPackage():
			return children

		for c in self._basePath.preauthChild('/'.join(parts)).globChildren(pattern):
			if not c.splitext()[-1].endswith('.js'):
				continue
			if c.basename() == self.packageFilename:
				continue
			if c.basename().count('.') > 1:
				# Must skip these, otherwise there will be problems.
				continue
			if c.isdir():
				# If it's a directory, skip it.
				continue

			moduleName = c.basename().split('.', 1)[0]

			name = '.'.join(parts + [moduleName])

			children.append(Script(name, self._basePath, self._mountedAt))

		return children


	def _underscoreName(self):
		"""
		Return the header required for the JS module to run.

		TODO: but only CW things require this. Should it just be in the module?
		"""
		
		return "%s={'__name__': '%s'}" % (self._name, self._name)


	def scriptContent(self):
		"""
		Generate an HTML4/5 <script> tag with the script contents.
		"""

		template = "<script>%s;\n%s</script>"

		return template % (self._underscoreName(), self.getContent())


	def scriptSrc(self):
		"""
		Generate an HTML4/5 <script src="...">
		"""

		if not isinstance(self._mountedAt, str):
			raise ValueError("Need a str for self._mountedAt; had %r" % (self._mountedAt,))

		template = """<script>%s</script><script src="%s?%s"></script>\n"""

		cacheBreaker = cacheBreakerForPath(self.getAbsoluteFilename())

		return template % (
			self._underscoreName(),
			uriparse.urljoin(self._mountedAt, self.getFilename()),
			cacheBreaker)

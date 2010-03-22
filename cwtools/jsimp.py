"""
This is designed to provide a Pythonic interface for concatenating both
Divmod (CW)-style JavaScript code, and Closure-style code.

Divmod-style code maps directly from the package name to a file path.
For example, Divmod.Defer maps to either
Divmod/Defer/__init__.js (first priority), or Divmod/Defer.js

Closure-style code does not map from "requires name" to a file path. Each
source file declares what it provides, like this:
	goog.provide('goog.mod1');
	goog.provide('goog.mod2');
It also declares what it requires:
	goog.require('goog.somedep');


Why do we bother concatenating Closure-style code, when Closure can load all
the JS it needs dynamically? Because a large project may require ~50 files, and
with a separate <script> per file, the page load slows down by at least a second.
"""

# TODO: write function to scan an entire directory (This will usually be the JSPATH)
# and build a cache of provided->file

# // import Some.thing
# lines will be assumed to use the filesystem directly, while
# goog.require(...) lines will use the provided->file dict to determine the Script.


import jinja2
import simplejson

##from twisted.python import log

_postImportVars = vars().keys()


def _extractOneArgFromFuncall(line, prefix):
	"""
	Sample usage:

	>>> _extractOneArgFromFuncall('goog.provide("test one")', 'goog.provide')
	'test one'

	>>> _extractOneArgFromFuncall("goog.provide('test one')", 'goog.provide')
	'test one'
	"""
	assert not '(' in prefix, prefix
	# len(prefix) + 1 because C{prefix} doesn't include the "("
	quotedString = line[len(prefix) + 1:line.find(')')]
	# JSON strings are always double-quoted, never single-quoted; so, fix them if needed.
	if quotedString[0] == "'" and quotedString[-1] == "'":
		quotedString = '"' + quotedString[1:-1] + '"'
	provide = simplejson.loads(quotedString)
	return provide



class ProvideConflict(Exception):
	pass



class DirectoryScan(object):

	def __init__(self, basePath):
		self._basePath = basePath
		self._mapping = {}
		self.rescan()


	def _scanPath(self, path, location):
		for c in path.children():
			if c.isdir():
				self._scanPath(c, location + [c.basename()])
			elif c.path.endswith('.js'):
				f = c.open('rb')
				last = -1
				for n, line in enumerate(f):
					if last != -1 and n > last + 100:
						break
					if line.startswith('goog.provide('):
						last = n
						provide = _extractOneArgFromFuncall(line, 'goog.provide')
						if provide in self._mapping:
							raise ProvideConflict("%r already in _mapping. "
								"Conflict between files %r and %r." % (
									provide, c, self._mapping[provide]))
						moduleName = c.basename().split('.', 1)[0] # copied from globChildren
						self._mapping[provide] = '.'.join(location + [moduleName])
				f.close()


	def rescan(self):
		self._mapping = {}
		self._scanPath(self._basePath, [])
#		for k, v in self._mapping.iteritems():
#			if not 'goog.' in k:
#				print k, '->', v


	def whoProvide(self, what):
		"""
		@param what: a thing that a js file provides with goog.provide(...)
		@type what: str

		Return the L{FilePath} object of the file that provides this
		"""
		return self._mapping.get(what)



class FindScriptError(Exception):
	"""
	Module/package doesn't exist, or __init__.js is missing.
	"""


class CircularDependencyError(Exception):
	pass



class CorruptScriptError(Exception):
	pass



def _depTraverse(script, treeCache, flat=None, depChain=None):
	"""
	DFS
	"""
	if flat is None:
		flat = []
	if depChain is None:
		depChain = [script]

	flat.append(script)
	deps = script.getDependencies(treeCache)
	for dep in deps: # remember, there could be 0 deps
		if dep in depChain:
			raise CircularDependencyError(
				"There exists a circular dependency in %r's imports." % (script,))

		flat.append(dep)
		_depTraverse(dep, treeCache, flat, depChain + [dep]) # ignore the return value

	return flat



def getDeps(script, treeCache=None):
	"""
	@type script: a L{Script}-like object.
	@param scripts: a L{Script}-like object which may or may not
		have dependencies.

	@rtype: list
	@return: the list of scripts that must be included
	for C{script} to work properly.
	"""
	if treeCache is None:
		treeCache = {}
	final = []
	bigList = _depTraverse(script, treeCache)
	bigList.reverse()
	alreadySeen = set()
	for item in bigList:
		if item not in alreadySeen:
			alreadySeen.add(item)
			final.append(item)
	return final



def getDepsMany(scripts, treeCache=None):
	"""
	@type scripts: any sequence
	@param scripts: sequence of L{Script}-like objects.

	@rtype: list
	@return: the list of scripts that must be included
	for C{scripts} to work properly.
	"""
	if treeCache is None:
		treeCache = {}

	# We don't need a real basePath for the VirtualScript; the
	# C{scripts} themselves may have real basePaths if needed.
	v = VirtualScript('', basePath=None, forcedDeps=scripts)

	deps = getDeps(v, treeCache=treeCache)
	deps.pop() # The last item is the VirtualScript itself, which we don't want.
	return deps



def megaScript(scripts):
	"""
	C{scripts} is an iterable of L{Script} or L{VirtualScript} objects.

	Return the contents of many scripts.
	"""
	data = ''

	for script in scripts:
		data += script._underscoreName() + u';\n'
		data += script.getContent()

	return data



def getAllFilenamesForContent(content, basePath):
	"""
	C{content} is a C{str} representing the contents of a script to
		get dependencies for.
	C{basePath} is a L{FilePath} representing the base path for on-disk
		scripts that are dependencies of C{content}

	Return a list of C{str} filenames, representing all of the dependencies
	needed to execute C{content}.
	"""
	assert isinstance(content, str), type(content)

	directoryScan = DirectoryScan(basePath)
	v = VirtualScript(content, basePath=basePath, directoryScan=directoryScan)
	deps = getDeps(v, treeCache={})
	deps.pop() # The last item is the VirtualScript itself, which we don't want.
	return list(s.getAbsoluteFilename() for s in deps)



def getAllFilenamesForFile(jsfile, basePath):
	"""
	C{jsfile} is a L{FilePath} representing the script to get dependencies for.
		It does not have to be inside C{basePath}.
	C{basePath} is a L{FilePath} representing the base path for on-disk
		scripts that are dependencies of C{jsfile}

	Return a list of C{str} filenames, representing all of the dependencies
	needed to execute C{content}.
	"""
	content = jsfile.open('rb').read()
	files = getAllFilenamesForContent(content, basePath)
	files.append(jsfile)
	return files



def parentContainsChild(parent, child):
	return child.startswith(parent + '.')



class NobodyProvidesThis(Exception):
	pass



class _BaseScript(object):
	"""
	Base class for both on-disk and in-memory scripts.
	"""
	def _getImportantStrings(self):
		if self._stringCache is not None:
			return self._stringCache

		self._isClosureStyle = False # by default, assume it is not Closure-style code.

		# Returns a list of UTF-8 encoded strings.
		data = dict(imports=[], requires=[])
		imports = data['imports']
		requires = data['requires']
		for line in self.getContent().split('\n'):
			if line.startswith('// import '):
				imports.append(line.rstrip().replace('// import ', '', 1).encode('utf-8'))
			elif line.startswith('//import '):
				imports.append(line.rstrip().replace('//import ', '', 1).encode('utf-8'))
			elif line.startswith('goog.require('):
				requires.append(_extractOneArgFromFuncall(line, 'goog.require').encode('utf-8'))
			elif line.startswith('goog.provide('):
				# goog.require doesn't guarantee that a script is Closure-style, as it
				# could be a Closure/CW hybrid that does both // import and goog.require.
				# So we check for goog.provide instead, which does guarantee it.
				self._isClosureStyle = True

		self._stringCache = data
		return data


	def _getForcedDependencies(self):
		return None


	def getDependencies(self, treeCache=None):
		"""
		Get dependency scripts for this script.

		To speed things up, caller can pass in the same dictionary for
		C{treeCache}, if doing many calls to L{getDependencies}.

		If using the same C{treeCache}, caller is responsible for calling
		L{getDependencies} only for the same self._basePath.

		As long as caller holds a reference to this dictionary and keeps
		passing it in, changes to scripts on disk will not be seen.
		"""
		if treeCache is None:
			treeCache = {}

		deps = []
		namesSeen = set()
		data = self._getImportantStrings()

		# Parent module is an implicit dependency for Divmod/CW-style code.
		if not (self._isClosureStyle or self._isGoogBase()):
			parent = self.getParent(treeCache)
			if parent:
				deps.append(parent)

		# Forced dependencies, if any
		forced = self._getForcedDependencies()
		if forced:
			deps.extend(forced)

		def _addImportee(importeeName):
			importee = treeCache.get(importeeName)
			if not importee:
				importee = self._getScriptWithName(importeeName)
				treeCache[importeeName] = importee
			deps.append(importee)

		for importeeName in data['imports']:
			##if importeeName in namesSeen or parentContainsChild(importeeName, self._name):
			##	log.msg('Unnecessary or duplicate import line in %r: // import %s' % (self, importeeName))
			namesSeen.add(importeeName)
			_addImportee(importeeName)

		# All Closure-style scripts depend on goog.base
		# Because Script('goog.base') is not Closure-style, it doesn't import itself
		if self._isClosureStyle:
			_addImportee('goog.base')

		for requireeName in data['requires']:
			importeeName = self._directoryScan.whoProvide(requireeName)
			if importeeName is None:
				raise NobodyProvidesThis("%r requires %r "
					"but nobody provides it." % (self, requireeName))
			_addImportee(importeeName)

		return deps



class Script(_BaseScript):
	"""
	Represents a JavaScript file that has:
		a full name,
		a base path where the "root package" is located on a filesystem,
		(maybe) a place where it "mounted at" on a web server.

	Depending its full name and its file contents, it may have:
		import dependencies
		a parent

	Modifying private attributes will screw up everything.
	"""

	packageFilename = '__init__.js'
	##__slots__ = ['_name', '_basePath', '_stringCache', '__weakref__']

	def __init__(self, name, basePath, directoryScan=None):
		"""
		C{name} is the module name (examples: 'module', 'package',
			'package.module')
		C{basePath} is a L{FilePath} representing the base path for on-disk
			scripts that this L{Script} can import/require.
		C{directoryScan} is a L{DirectoryScan}, or C{None}.
		"""
		# TODO: verify that `name' is a valid JavaScript identifier (or identifier.identifier, and so on.)
		self._name = name
		self._basePath = basePath
		self._directoryScan = directoryScan
		self._stringCache = None


	def __eq__(self, other):
		if type(self) != type(other):
			return False
		return (self._name == other._name and
			self._basePath == other._basePath)


	def __ne__(self, other):
		return not self.__eq__(other)


	def __hash__(self):
		return hash((self._name, self._basePath))


	def __repr__(self):
		return '<%s %r in %r>' % (
			self.__class__.__name__, self._name, self._basePath.basename())


	def _getScriptWithName(self, name):
		return self.__class__(name, self._basePath, self._directoryScan)


	def getName(self):
		return self._name


	def _isGoogBase(self):
		return self._name == 'goog.base'


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
				raise FindScriptError("Tried to find %r but no such file %r" % (
					self._name, location))

		return location


	def getAbsoluteFilename(self):
		"""
		Returns a L{t.p.f.FilePath} object representing the absolute
		filename of the script.
		"""
		return self._basePath.preauthChild(self.getFilename())


	def getContent(self):
		"""
		Get the unicode content of this script.
		"""
		bytes = self.getAbsoluteFilename().getContent()
		if len(bytes) == 0:
			return u'' # no need to run jinja2 on empty unicode string
		elif bytes[-1] != '\n':
			raise CorruptScriptError((
				r"Script %r needs to end with a \n. "
				r"\n is a line terminator, not a separator. "
				"Fix your text editor. Last 100 bytes were: %r"
				) % (self, bytes[-100:]))
		else:
			uni = bytes.decode('utf-8')

		return uni


	def _getParentName(self):
		"""
		Returns the name of the "parent" script, or C{None} if this Script
		is the root.
		"""
		parts = self._name.split('.')
		if len(parts) == 1:
			return None
		else:
			return '.'.join(parts[:-1])


	def getParent(self, treeCache=None):
		if treeCache is None:
			treeCache = {}

		parentName = self._getParentName()
		if not parentName:
			return None
		parentModule = treeCache.get(parentName)
		if not parentModule:
			parentModule = self._getScriptWithName(parentName)
			treeCache[parentName] = parentModule

		return parentModule


	def globChildren(self, pattern):
		"""
		C{pattern} is a glob pattern that matches filenames
		(including the .js extension) and package directories.
		It should almost always end with C{'*'}.

		This will return both child modules and child packages.
		"""
		parts = self._name.split('.')

		children = []

		if not self._isPackage():
			return children

		for c in self._basePath.preauthChild('/'.join(parts)).globChildren(pattern):
			if not c.isdir() and not c.splitext()[-1].endswith('.js'):
				continue
			if c.basename() == self.packageFilename:
				continue
			if c.basename().count('.') > 1:
				# Must skip these, otherwise there will be problems.
				continue
			if c.isdir() and not c.child(self.packageFilename).exists():
				continue

			moduleName = c.basename().split('.', 1)[0]

			name = '.'.join(parts + [moduleName])

			children.append(self._getScriptWithName(name))

		return children


	def _underscoreName(self):
		"""
		Return the header required for the JS module to run.
		"""
		if not hasattr(self, '_isClosureStyle'):
			self._getImportantStrings()

		if not self._isClosureStyle and not self._isGoogBase():
			# This is absolutely necessary, even if current script is CW-style. Consider this case:
			#     cw.net.Test is CW-Style
			#     cw.net is Closure-style
			# The loading of cw.net.Test cannot override the existing cw.net namespace.
			return ("if(typeof %s == 'undefined') { %s = {} }; "
				"%s.__name__ = '%s'" % ((self._name,) * 4))
		else:
			return '/* Closure-style module: %s */' % (self._name,)



class NoBasePathNoImportsError(Exception):
	pass



class VirtualScript(_BaseScript):
	"""
	Represents a JavaScript script stored only in memory.
	"""
	_realScriptClass = Script

	def __init__(self, content, basePath=None, forcedDeps=None, directoryScan=None):
		"""
		@param content: the script content
		@type content: unicode

		@param basePath: base path for on-disk scripts that
			this L{VirtualScript} can import/require
		@type basePath: L{FilePath}

		@param forcedDeps: sequence of L{Script}-like objects to
			treat as dependencies for this L{VirtualScript}, in addition
			to the imports in C{content}.
		@type forcedDeps: any sequence

		@param directoryScan: A L{DirectoryScan}
		@type directoryScan: L{DirectoryScan}
		"""
		self._content = content
		self._basePath = basePath
		self._forcedDeps = forcedDeps
		self._stringCache = None
		self._directoryScan = directoryScan


	def __eq__(self, other):
		if type(self) != type(other):
			return False
		return (
			self._content == other._content and
			self._basePath == other._basePath)


	def __ne__(self, other):
		return not self.__eq__(other)


	def __hash__(self):
		return hash(self._content)


	def __repr__(self):
		return '<%s, content begin with %r>' % (
			self.__class__.__name__, self._content)


	def _isGoogBase(self):
		return False


	def _getForcedDependencies(self):
		return self._forcedDeps


	def _getScriptWithName(self, name):
		if self._basePath is None:
			raise NoBasePathNoImportsError(
				"basePath is None, so I cannot instantiate Scripts")
		return self._realScriptClass(name, self._basePath, self._directoryScan)


	def _underscoreName(self):
		return "/* %s */" % (self.__class__.__name__,)


	def getContent(self):
		"""
		Get the unicode content of this script.
		"""
		return self._content


	def getParent(self, treeCache=None):
		return None



from pypycpyo import optimizer
optimizer.bind_all_many(vars(), _postImportVars)

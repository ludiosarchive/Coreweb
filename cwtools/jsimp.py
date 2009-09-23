import struct
import jinja2

from twisted.python import log

from webmagic import uriparse


class FindScriptError(Exception):
	"""
	Module/package doesn't exist, or __init__.js is missing.
	"""


class CircularDependencyError(Exception):
	pass



class CorruptScriptError(Exception):
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
	Return the list of scripts that must be included
	for L{script} to work properly.
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
	Return the list of scripts that must be included
	for L{scripts} to work properly.
	"""
	if treeCache is None:
		treeCache = {}
	alreadySeen = set()
	returnList = []
	for script in scripts:
		deps = getDeps(script, treeCache)
		for dep in deps:
			if dep not in alreadySeen:
				returnList.append(dep)
				alreadySeen.add(dep)
	return returnList



def megaScript(scripts, wrapper, dictionary={}):
	"""
	C{scripts} is an iterable of L{Script} objects.

	C{wrapper} should be true C{True} if you want the wrapper,
		otherwise C{False}.

	C{dictionary} is a dictionary of key->value to pass into
		each Script's renderContent(). If C{wrapper} was C{True},
		C{'_wasWrapped': True} will be added to C{dictionary}.

	Return the contents of many scripts, optionally wrapping
	it with the anonymous function wrapper (useful for JScript,
	which thinks named function expressions are declarations.)
	"""
	data = ''
	if wrapper:
		dictionary['_wasWrapped'] = True
		data += u'''\
(function(window, undefined) {
var document = window.document;
'''
	for script in scripts:
		data += script._underscoreName() + u';\n'
		data += script.renderContent(dictionary)

	if wrapper:
		data += u'})(window);\n'

	return data



class Script(object):
	"""
	Represents a JavaScript file.

	Modifying private attributes will screw up everything.
	"""

	# TODO: use flyweight pattern on Script, and cache the dependency list.

	packageFilename = '__init__.js'
	__slots__ = ['_name', '_basePath', '_mountedAt', '_importStringCache', '__weakref__']

	def __init__(self, name, basePath, mountedAt=None):
		"""
		L{name} is the module name (examples: 'module', 'package', 'package.module')
		L{basePath} is a twisted.python.filepath.FilePath instance.
		L{mountedAt} (optional) is a relative or absolute URI,
			indicating where the root package is on the web server.
		"""
		# TODO: verify that `name' is a valid JavaScript identifier (or identifier.identifier, and so on.)
		self._name = name
		self._basePath = basePath
		self._mountedAt = mountedAt
		self._importStringCache = None


	def __eq__(self, other):
		if not isinstance(other, Script):
			return False
		return (self._name == other._name and
			self._basePath == other._basePath and
			self._mountedAt == other._mountedAt)


	def __hash__(self):
		return hash((self._name, self._basePath, self._mountedAt))


	def __repr__(self):
		return '<%s %r in %r @ %r>' % (
			self.__class__.__name__, self._name, self._basePath.basename(), self._mountedAt)


	def _getScriptWithName(self, name):
		return self.__class__(name, self._basePath, self._mountedAt)


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
		"""
		Get the unicode content of this file.
		"""
		bytes = self.getAbsoluteFilename().getContent()
		if len(bytes) == 0:
			return u'' # no need to run jinja2 on empty unicode string
		elif bytes[-1] != '\n':
			raise CorruptScriptError((
				r"Script %r needs to end with a \n. "
				r"\n is a line terminator, not a separator. "
				"Fix your text editor. Last 100 bytes were: %r") % (self, bytes[-100:]))
		else:
			uni = bytes.decode('utf-8')

		return uni


	def renderContent(self, dictionary={}):
		"""
		Get the post-template-render textual content of this script. Returns unicode.

		L{dictionary} is a dictionary of key->value for the template renderer.
		"""
		uni = self.getContent()
		return _theWriter.render(uni, dictionary)


	def _getParentName(self):
		"""
		Returns None if this Script is the root.
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


	def _getImportStrings(self):
		if self._importStringCache is not None:
			return self._importStringCache

		# Returns a list of UTF-8 encoded strings.
		imports = []
		for line in self.getContent().split('\n'):
			clean = line.rstrip()
			if clean.startswith('// import '):
				imports.append(clean.replace('// import ', '', 1).encode('utf-8'))
			elif clean.startswith('//import '):
				imports.append(clean.replace('//import ', '', 1).encode('utf-8'))
			else:
				continue

		self._importStringCache = imports
		return imports


	def getDependencies(self, treeCache=None):
		"""
		Get dependency scripts for this script.

		To speed things up, caller can pass in the same dictionary for
		C{treeCache}, if doing many calls to L{getDependencies}.

		If using the same C{treeCache}, caller is responsible for calling
		L{getDependencies} only for the same pair of (self._basePath, self._mountedAt).

		As long as caller holds a reference to this dictionary and keeps
		passing it in, changes to scripts on disk will not be seen.
		"""
		if treeCache is None:
			treeCache = {}

		deps = []

		# Parent module is an implicit dependency
		parent = self.getParent(treeCache)
		if parent:
			deps.append(parent)
		
		for importeeName in self._getImportStrings():
			importee = treeCache.get(importeeName)
			if not importee:
				importee = self._getScriptWithName(importeeName)
				treeCache[importeeName] = importee
				if importee in deps:
					log.msg('Unnecessary import line in %r: // import %s' % (self, importeeName))
			deps.append(importee)
		return deps


	def globChildren(self, pattern):
		"""
		L{pattern} is a glob pattern that matches filenames
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

		TODO: but only CW things require this. Should it just be in the module?
		"""
		
		return "%s = {'__name__': '%s'}" % (self._name, self._name)


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



class JavaScriptWriter(object):

	"""
	The macro language defined here should be easily portable to another
	template system / language (maybe TeX?).

	When writing things for this template system, make it sound like English:

	browser.supports('JSON')

	browser.hasBug('')
	"""

	def __init__(self):

		# These are chosen very carefully so that JS syntax-highlights reasonably
		# even with these ugly macros.

		self.env = jinja2.Environment(
			line_statement_prefix = '//]',
			variable_start_string = '/**/',
			variable_end_string = '//',
			# TODO: ? also define block_(end|start)_string
			comment_start_string = '/*###',
			comment_end_string = '*/',
		)


	def render(self, template, dictionary):
		"""
		L{template} is the unicode (or str) template.
		L{dictionary} is a dict of values to help fill the template.

		Return value is the rendered template, in unicode.
		"""
		rendered = self.env.from_string(template).render(dictionary)
		# jinja2 forgets about how many newlines there should be at the end, or something
		if not rendered.endswith(u'\n'):
			rendered += u'\n'
		return rendered


_theWriter = JavaScriptWriter()

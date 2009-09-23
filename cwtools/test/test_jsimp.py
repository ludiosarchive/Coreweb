# -*- coding: utf-8 -*-

from twisted.python.filepath import FilePath
from twisted.trial import unittest

import string

from cwtools import jsimp


class CacheBreakerTests(unittest.TestCase):

	def test_cacheBreakerForPath(self):

		for i in xrange(10):
			tempFile = FilePath(self.mktemp())
			tempFile.setContent("nothing to see here")

			breaker = jsimp.cacheBreakerForPath(tempFile)

			# Breaker doesn't change
			for n in xrange(20):
				breakerAgain = jsimp.cacheBreakerForPath(tempFile)
				self.assertEqual(breaker, breakerAgain)

			# Length is sane
			self.assertEqual(16, len(breaker))

			# Only allow URL-safe characters.
			# This should catch a programming error only most of the time,
			# because we test 10 temp files.
			okay = set(string.digits + string.letters)
			self.assertTrue(all(c in okay) for c in breaker)

			# TODO: Test: Touching the file changes the breaker

			# TODO: Test: Writing to the file (incl. associated
			# mtime modification) changes the breaker



class ComparisonTests(unittest.TestCase):

	def test_compare(self):
		self.assertEqual(
			jsimp.Script('p.mod1', '/tmp'),
			jsimp.Script('p.mod1', '/tmp')
		)


	def test_compareAndMountedAt(self):
		self.assertEqual(
			jsimp.Script('p.mod1', '/tmp', '/'),
			jsimp.Script('p.mod1', '/tmp', '/')
		)


	def test_notEqualAndMountedAt(self):
		self.assertNotEqual(
			jsimp.Script('p.mod1', '/tmp'),
			jsimp.Script('p.mod1', '/tmp', '')
		)


	def test_sameHash(self):
		self.assertEqual(
			hash(jsimp.Script('p.mod1', '/tmp')),
			hash(jsimp.Script('p.mod1', '/tmp'))
		)



	def test_putInSet(self):
		s = set()
		x1 = jsimp.Script('p.mod1', '/tmp')
		x2 = jsimp.Script('p.mod1', '/tmp')
		s.add(x1)
		s.add(x2)
		self.assertEqual(1, len(s))



class PathForModuleTests(unittest.TestCase):

	def test_fileDepth1(self):
		d = FilePath(self.mktemp())
		c = d.child('something')
		c.makedirs()
		c.child('mod1.js').setContent("// I am mod1")

		self.assertEqual(
			'something/mod1.js',
			jsimp.Script("something.mod1", d).getFilename()
		)


	def test_fileDepth2(self):
		d = FilePath(self.mktemp())
		c = d.child('something').child('more')
		c.makedirs()
		c.child('mod2.js').setContent("// I am mod2")

		self.assertEqual(
			'something/more/mod2.js',
			jsimp.Script("something.more.mod2", d).getFilename()
		)


	def test_fileDepth2WithInitJS(self):
		d = FilePath(self.mktemp())
		c = d.child('something').child('more')
		c.makedirs()
		c.child('__init__.js').setContent("// I am __init__")
		c.child('mod2.js').setContent("// I am mod2")

		self.assertEqual(
			'something/more/__init__.js',
			jsimp.Script("something.more", d).getFilename())

		self.assertEqual(
			'something/more/mod2.js',
			jsimp.Script("something.more.mod2", d).getFilename())


	def test_noSuchJS(self):
		d = FilePath(self.mktemp())

		self.assertRaises(
			jsimp.FindScriptError,
			lambda: jsimp.Script("doesnt.exist", d).getFilename())


	def test_noSuchJSInitJS(self):
		d = FilePath(self.mktemp())

		d.child('doesnt').child('exist').makedirs()

		self.assertRaises(
			jsimp.FindScriptError,
			lambda: jsimp.Script("doesnt.exist", d).getFilename())



class ScriptTagTests(unittest.TestCase):
	"""
	Tests for L{Script}'s L{scriptContent} and L{scriptSrc}
	"""

	def test_scriptContents(self):
		d = FilePath(self.mktemp())

		c = d.child('p')
		c.makedirs()
		contents = 'function a() { return "A func"; }\n'
		c.child('mod1.js').setContent(contents)

		html = jsimp.Script('p.mod1', d).scriptContent()
		self.assertEqual(
			u"""<script>p.mod1 = {'__name__': 'p.mod1'};\n%s</script>""" % (contents,),
			html
		)


	def test_scriptSrc(self):
		d = FilePath(self.mktemp())

		c = d.child('p')
		c.makedirs()
		contents = 'function a() { return "A func"; }'
		c.child('mod1.js').setContent(contents)

		for mountedAt in ['/hello/', 'http://another.domain/']:

			script = jsimp.Script('p.mod1', d, mountedAt=mountedAt)
			html = script.scriptSrc()

			self.assert_(
				html.startswith("""<script>%s</script><script src="%s?""" % (script._underscoreName(), mountedAt + 'p/mod1.js'))
			)

			self.assert_(
				html.endswith("""</script>\n""")
			)


	def test_scriptSrcError(self):
		d = FilePath(self.mktemp())

		c = d.child('p')
		c.makedirs()
		contents = 'function a() { return "A func"; }'
		c.child('mod1.js').setContent(contents)

		self.assertRaises(ValueError, lambda: jsimp.Script('p.mod1', d).scriptSrc())



class ImportParsingTests(unittest.TestCase):

	def test_getImportStrings(self):
		d = FilePath(self.mktemp())
		c = d.child('p')
		c.makedirs()
		contents = '''\
// import p	\r
// import p.blah
//import p.other

function a() { return "A func"; }

// import p.last
'''
		c.child('mod1.js').setContent(contents)

		strings = jsimp.Script('p.mod1', d)._getImportStrings()

		self.assertEqual(
			['p', 'p.blah', 'p.other', 'p.last'],
			strings)

		self.assert_(all(isinstance(s, str) for s in strings), "Not all were str: %r" % (strings))


	def test_getDependencies(self):
		d = FilePath(self.mktemp())
		d.makedirs()
		
		d.child('p.js').setContent('// import q\n// import r\n')
		d.child('q.js').setContent('// \n')
		d.child('r.js').setContent('// \n')

		p = jsimp.Script('p', d)
		q = jsimp.Script('q', d)
		r = jsimp.Script('r', d)

		self.assertEqual(
			[q, r],
			p.getDependencies())


	def test_getDependenciesIncludesParents(self):
		d = FilePath(self.mktemp())
		d.makedirs()
		d.child('sub').makedirs()

		d.child('p.js').setContent('// import q\n// import r\n')
		d.child('q.js').setContent('// \n')
		d.child('r.js').setContent('// \n')
		d.child('sub').child('__init__.js').setContent('// import q\n')
		d.child('sub').child('noimportlines.js').setContent('// \n')

		p = jsimp.Script('p', d)
		q = jsimp.Script('q', d)
		r = jsimp.Script('r', d)
		initjs = jsimp.Script('sub', d)
		noimportlines = jsimp.Script('sub.noimportlines', d)

		self.assertEqual(
			[q, r],
			p.getDependencies())

		self.assertEqual(
			[q],
			initjs.getDependencies())

		self.assertEqual(
			[initjs],
			noimportlines.getDependencies())



class GetNameTests(unittest.TestCase):

	def test_getNameRoot(self):
		d = FilePath(self.mktemp())
		d.makedirs()
		c = d.child('amodule.js')
		c.setContent('//')

		self.assertEqual(
			'amodule',
			jsimp.Script('amodule', d).getName())


	def test_getNameInPackage(self):
		d = FilePath(self.mktemp())
		d.child('apackage').makedirs()
		c = d.child('amodule.js')
		c.setContent('//')

		self.assertEqual(
			'apackage.amodule',
			jsimp.Script('apackage.amodule', d).getName())



class _ScriptTracksReads(jsimp.Script):
	"""
	A Script that tracks when getContent is called, to verify
	that caching actually works.
	"""

	def __init__(self, name, basePath, trackingList):
		jsimp.Script.__init__(self, name, basePath)
		self.trackingList = trackingList


	def _getScriptWithName(self, name):
		return self.__class__(name, self._basePath, self.trackingList)


	def getContent(self):
		#print self
		self.trackingList.append(self)
		return jsimp.Script.getContent(self)



class TreeCacheTests(unittest.TestCase):

	def setUp(self):
		self.trackingList = []

		d = FilePath(self.mktemp())
		d.makedirs()

		# These tests must have a parent. Both parents and importees are cached.

		d.child('p1').makedirs()
		d.child('p1').child('__init__.js').setContent('//\n')
		d.child('p1').child('child1.js').setContent('//\n')
		d.child('p1').child('child2.js').setContent('// import p1.child1\n')
		d.child('p1').child('child3.js').setContent('// import p1.child2\n//import p1.child1\n')
		d.child('p1').child('child4.js').setContent('// import p1.child3\n// import p1.child2\n//import p1.child1\n')

		self.initjs = _ScriptTracksReads('p1', d, self.trackingList)
		self.child1 = _ScriptTracksReads('p1.child1', d, self.trackingList)
		self.child2 = _ScriptTracksReads('p1.child2', d, self.trackingList)
		self.child3 = _ScriptTracksReads('p1.child3', d, self.trackingList)
		self.child4 = _ScriptTracksReads('p1.child4', d, self.trackingList)

		self.goodOrder = [self.child4, self.initjs, self.child3, self.child2, self.child1]


	def test_getDependenciesNotCached(self):
		"""
		Proper read-order is impossible without cache.
		"""
		# Do it twice, to make sure there's no caching.
		jsimp.getDeps(self.child4)
		jsimp.getDeps(self.child4)

		self.assert_(len(self.trackingList) > len(self.goodOrder),
			'self.trackingList %r should have been longer than self.goodOrder' % (self.trackingList,))

		self.assertNotEqual(self.goodOrder, self.trackingList)


	def test_getDependenciesIsCached(self):
		"""
		Even with a lot of imports, each script is only read once.
		"""
		treeCache =  {}
		# Do it twice, to make sure treeCache is being used.
		jsimp.getDeps(self.child4, treeCache)
		jsimp.getDeps(self.child4, treeCache)

		self.assertEqual(self.goodOrder, self.trackingList)



class GetChildrenTests(unittest.TestCase):

	def test_globChildrenWildcard(self):
		# It shouldn't get confused by strange directory names.
		d = FilePath(self.mktemp()).child('directory.with.dots').child('directory.with.js')
		d.makedirs()

		d.child('p1').makedirs()
		d.child('p1').child('__init__.js').setContent('//')
		d.child('p1').child('child1.js').setContent('//')
		d.child('p1').child('child2.js').setContent('//')
		d.child('p1').child('child2.bak.js').setContent(
			'// I am a backup file, to be ignored because I have too many dots in my filename.')
		d.child('p1').child('child2.notjs').setContent('not a .js file')
		d.child('p1').child('emptydir').makedirs()
		d.child('p1').child('blah.js').makedirs() # A deceptive directory. Must be ignored.


		p1 = jsimp.Script('p1', d)
		child1 = jsimp.Script('p1.child1', d)
		child2 = jsimp.Script('p1.child2', d)		

		# Directory listing order is arbitrary

		self.assertEqual(
			set([child1, child2]),
			set(p1.globChildren('*')))


	def test_globChildrenPattern(self):
		d = FilePath(self.mktemp())
		d.makedirs()
		d.child('p1').makedirs()
		d.child('p1').child('__init__.js').setContent('//')
		d.child('p1').child('Testchild1.js').setContent('//')
		d.child('p1').child('child2.js').setContent('//')
		d.child('p1').child('Testchild3.js').setContent('//')

		p1 = jsimp.Script('p1', d)
		child1 = jsimp.Script('p1.Testchild1', d)
		child2 = jsimp.Script('p1.child2', d)
		child3 = jsimp.Script('p1.Testchild3', d)

		# Directory listing order is arbitrary

		self.assertEqual(
			set([child1, child3]),
			set(p1.globChildren('Test*')))


	def test_globChildrenPackageAndInitJS(self):
		d = FilePath(self.mktemp())
		d.makedirs()
		d.child('p1').makedirs()
		d.child('p1').child('__init__.js').setContent('//')
		d.child('p1').child('Testchild1.js').setContent('//')
		d.child('p1').child('Testchild4').makedirs()
		d.child('p1').child('Testchild4').child('__init__.js').setContent('//')
		d.child('p1').child('child2.js').setContent('//')
		d.child('p1').child('Testchild3.js').setContent('//')

		p1 = jsimp.Script('p1', d)
		child1 = jsimp.Script('p1.Testchild1', d)
		child2 = jsimp.Script('p1.child2', d)
		child3 = jsimp.Script('p1.Testchild3', d)
		child4 = jsimp.Script('p1.Testchild4', d)

		# Directory listing order is arbitrary

		self.assertEqual(
			set([child1, child3, child4]),
			set(p1.globChildren('Test*')))


	def test_globChildrenPackageButNoInitJS(self):
		d = FilePath(self.mktemp())
		d.makedirs()
		d.child('p1').makedirs()
		d.child('p1').child('__init__.js').setContent('//')
		d.child('p1').child('Testchild1.js').setContent('//')
		d.child('p1').child('Testchild4').makedirs()
		d.child('p1').child('child2.js').setContent('//')
		d.child('p1').child('Testchild3.js').setContent('//')

		p1 = jsimp.Script('p1', d)
		child1 = jsimp.Script('p1.Testchild1', d)
		child2 = jsimp.Script('p1.child2', d)
		child3 = jsimp.Script('p1.Testchild3', d)

		# Directory listing order is arbitrary

		self.assertEqual(
			set([child1, child3]),
			set(p1.globChildren('Test*')))




class _DummyScript(object):
	"""
	A dummy for L{Script}, to avoid writing files to disk and to avoid
	other L{Script} implementation details.
	"""

	def __init__(self, name, deps, otherDummies):
		self.name = name
		self.deps = deps
		self.otherDummies = otherDummies


	def __repr__(self):
		return '<_DummyScript %r with %d deps>' % (self.name, len(self.deps))


	def __eq__(self, other):
		return (self.name == other.name)


	def __hash__(self):
		return hash(self.name)


	def getDependencies(self, treeCache=None): # treeCache is ignored
		# O(N^2) but it doesn't matter since this is a dummy
		final = []
		for dep in self.deps:
			for dummy in self.otherDummies:
				if dummy.name == dep:
					final.append(dummy)
		return final



class DependencyTests(unittest.TestCase):

	def test_getDeps(self):
		# The annoying string + allDummies code is to list dependencies without
		# actually ordering everything correctly in the unit test code.

		allDummies = set()
		modx = _DummyScript('modx', [], allDummies)
		mod3 = _DummyScript('mod3', [], allDummies)
		mod2 = _DummyScript('mod2', ['mod3'], allDummies)
		mod1 = _DummyScript('mod1', ['mod2', 'modx'], allDummies)

		allDummies.update([modx, mod3, mod2, mod1])

		# There are many valid import orders for this, so this is implementation-specific.

		self.assertEqual(
			[modx, mod3, mod2, mod1],
			jsimp.getDeps(mod1)
		)


	def test_getDepsComplicated(self):
		allDummies = set()

		x = _DummyScript('x', 'f'.split(','), allDummies)
		f = _DummyScript('f', 'e,c,q'.split(','), allDummies)
		e = _DummyScript('e', 'd,b,c'.split(','), allDummies)
		c = _DummyScript('c', 'a'.split(','), allDummies)
		d = _DummyScript('d', 'b,z'.split(','), allDummies)
		b = _DummyScript('b', 'a'.split(','), allDummies)
		a = _DummyScript('a', 'z'.split(','), allDummies)
		z = _DummyScript('z', [], allDummies)
		q = _DummyScript('q', [], allDummies)

		for letter in 'x,f,e,c,d,b,a,z,q'.split(','):
			exec ('allDummies.add(%s)' % (letter,))

		# There are many valid import orders for this, so this is implementation-specific.
		# another valid order would be: z a b c d q e f x

		self.assertEqual(
			[q, z, a, c, b, d, e, f, x],
			jsimp.getDeps(x)
		)


	def test_getDepsComplicatedMore(self):
		allDummies = set()

		# 12 links total

		a = _DummyScript('a', 'b'.split(','), allDummies)
		b = _DummyScript('b', [], allDummies)
		c = _DummyScript('c', 'q'.split(','), allDummies)
		d = _DummyScript('d', 'q,c'.split(','), allDummies)
		e = _DummyScript('e', 'p,d,r,s'.split(','), allDummies)
		p = _DummyScript('p', 's'.split(','), allDummies)
		q = _DummyScript('q', 'a'.split(','), allDummies)
		r = _DummyScript('r', 'b'.split(','), allDummies)
		s = _DummyScript('s', 'c'.split(','), allDummies)

		for letter in 'a,b,c,d,e,p,q,r,s'.split(','):
			exec ('allDummies.add(%s)' % (letter,))

		# There are many valid import orders for this, so this is implementation-specific.

		self.assertEqual(
			[b, a, q, c, s, r, d, p, e],
			jsimp.getDeps(e)
		)


	def test_getDepsCircularTwo(self):
		allDummies = set()

		a = _DummyScript('a', 'b'.split(','), allDummies)
		b = _DummyScript('b', 'a'.split(','), allDummies)

		allDummies.update([a, b])

		for script in [a, b]:
			self.assertRaises(
				jsimp.CircularDependencyError,
				lambda: jsimp.getDeps(script)
			)


	def test_getDepsCircularThree(self):
		allDummies = set()

		a = _DummyScript('a', 'b'.split(','), allDummies)
		b = _DummyScript('b', 'c'.split(','), allDummies)
		c = _DummyScript('c', 'a'.split(','), allDummies)

		allDummies.update([a, b, c])

		for script in [a, b, c]:
			self.assertRaises(
				jsimp.CircularDependencyError,
				lambda: jsimp.getDeps(script)
			)


	def test_getDepsMany(self):
		allDummies = set()

		a = _DummyScript('a', 'b'.split(','), allDummies)
		b = _DummyScript('b', [], allDummies)

		d = _DummyScript('d', 'z'.split(','), allDummies)
		z = _DummyScript('z', [], allDummies)

		allDummies.update([a, b, d, z])

		self.assertEqual(
			[b, a, z, d],
			jsimp.getDepsMany([a, d])
		)


	def test_getDepsManyRedundant(self):
		"""
		Both `a' and `d' depend on `z'. Make sure `z' is only in deps once.
		"""
		allDummies = set()

		a = _DummyScript('a', 'b'.split(','), allDummies)
		b = _DummyScript('b', 'z'.split(','), allDummies)

		d = _DummyScript('d', 'z'.split(','), allDummies)
		z = _DummyScript('z', [], allDummies)

		allDummies.update([a, b, d, z])

		self.assertEqual(
			[z, b, a, d],
			jsimp.getDepsMany([a, d])
		)



class TestCorruptScripts(unittest.TestCase):

	def test_emptyIsOkay(self):
		d = FilePath(self.mktemp())
		d.makedirs()
		c = d.child('amodule.js')
		c.setContent('')

		self.assertEqual('', jsimp.Script('amodule', d).getContent())


	def test_newlineRequired(self):
		d = FilePath(self.mktemp())
		d.makedirs()
		c = d.child('amodule.js')
		c.setContent('//')

		self.assertRaises(jsimp.CorruptScriptError, lambda: jsimp.Script('amodule', d).getContent())



class _DummyContentScript(jsimp.Script):
	"""
	A dummy.
	"""

	def __init__(self, name, content):
		jsimp.Script.__init__(self, name, '_fakeBasePath')

		class _fileObj(object):
			def getContent(self2):
				return content

		self._fo = _fileObj()


	def getAbsoluteFilename(self):
		return self._fo



class MegaScriptTests(unittest.TestCase):

	def test_megaScriptNoWrapper(self):
		s1 = _DummyContentScript('s1', 'var x={};\n')
		s2 = _DummyContentScript('s2', 'var y={};\n')
		result = jsimp.megaScript([s1, s2], False)
		self.assertEqual(u'''\
s1 = {'__name__': 's1'};
var x={};
s2 = {'__name__': 's2'};
var y={};
''', result)


	def test_megaScriptWrapper(self):
		s1 = _DummyContentScript('s1', 'var x={};\n')
		s2 = _DummyContentScript('s2', 'var y={};\n')
		result = jsimp.megaScript([s1, s2], True)
		self.assertEqual(u'''\
(function(window, undefined) {
var document = window.document;
s1 = {'__name__': 's1'};
var x={};
s2 = {'__name__': 's2'};
var y={};
})(window);
''', result)


	def test_dictionaryOption(self):
		s1 = _DummyContentScript('s1', 'var x=/**/something//;\n', )
		s2 = _DummyContentScript('s2', 'var y=/**/not_passed//;\n', )

		result = jsimp.megaScript([s1, s2], False, dict(something="hi"))

		self.assertEqual(u'''\
s1 = {'__name__': 's1'};
var x=hi;
s2 = {'__name__': 's2'};
var y=;
''', result)



class RenderContentTests(unittest.TestCase):

	def test_getNormalContent(self):
		s1 = _DummyContentScript('name', 'content\n')
		self.assertEqual('content\n', s1.renderContent({}))


	def test_getTemplatedContent(self):
		s1 = _DummyContentScript('name',
u'''\
content
//] if 1 == 1
x
//] endif
''')
		self.assertEqual(u'content\nx\n', s1.renderContent({}))


	def test_getTemplatedVariableContent1(self):
		s1 = _DummyContentScript('name',
u'''\
content
//] if _xMode == 1
x
//] endif
''')
		self.assertEqual(u'content\nx\n', s1.renderContent(dict(_xMode=1)))


	def test_getTemplatedVariableContent2(self):
		s1 = _DummyContentScript('name',
u'''\
content
//] if _xMode == 1
x
//] endif
''')
		self.assertEqual(u'content\n', s1.renderContent(dict(_xMode="1")))

# -*- coding: utf-8 -*-

from twisted.python.filepath import FilePath
from twisted.trial import unittest

import os
import string

from cwtools import jsimp


class CacheBreakerTests(unittest.TestCase):

	def test_cacheBreakerForPath(self):

		for i in xrange(10):
			tempFile = self.mktemp()
			x = open(tempFile, 'wb')
			x.write("nothing to see here")
			x.close()

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
			jsimp.Script("something.mod1", d.path).getFilename()
		)


	def test_fileDepth2(self):
		d = FilePath(self.mktemp())
		c = d.child('something').child('more')
		c.makedirs()
		c.child('mod2.js').setContent("// I am mod2")

		self.assertEqual(
			'something/more/mod2.js',
			jsimp.Script("something.more.mod2", d.path).getFilename()
		)


	def test_fileDepth2WithInitJS(self):
		d = FilePath(self.mktemp())
		c = d.child('something').child('more')
		c.makedirs()
		c.child('__init__.js').setContent("// I am __init__")
		c.child('mod2.js').setContent("// I am mod2")

		self.assertEqual(
			'something/more/__init__.js',
			jsimp.Script("something.more", d.path).getFilename())

		self.assertEqual(
			'something/more/mod2.js',
			jsimp.Script("something.more.mod2", d.path).getFilename())


	def test_noSuchJS(self):
		d = FilePath(self.mktemp())

		self.assertRaises(
			jsimp.FindScriptError,
			lambda: jsimp.Script("doesnt.exist", d.path).getFilename())


	def test_noSuchJSInitJS(self):
		d = FilePath(self.mktemp())

		d.child('doesnt').child('exist').makedirs()

		self.assertRaises(
			jsimp.FindScriptError,
			lambda: jsimp.Script("doesnt.exist", d.path).getFilename())



class ScriptForTests(unittest.TestCase):

	def test_scriptContents(self):
		d = FilePath(self.mktemp())

		c = d.child('p')
		c.makedirs()
		contents = 'function a() { return "A func"; }'
		c.child('mod1.js').setContent(contents)

		html = jsimp.Script('p.mod1', d.path).scriptContent()
		self.assertEqual(
			"""<script>p.mod1={'__name__':'p.mod1'};%s</script>""" % (contents,),
			html
		)


	def test_scriptSrc(self):
		d = FilePath(self.mktemp())

		c = d.child('p')
		c.makedirs()
		contents = 'function a() { return "A func"; }'
		c.child('mod1.js').setContent(contents)

		for mountedAt in ['/hello/', 'http://another.domain/']:

			script = jsimp.Script('p.mod1', d.path, mountedAt=mountedAt)
			html = script.scriptSrc()

			self.assert_(
				html.startswith("""<script>%s</script><script src="%s?""" % (script._underscoreName(), mountedAt + 'p/mod1.js'))
			)

			self.assert_(
				html.endswith("""</script>""")
			)


	def test_scriptSrcError(self):
		d = FilePath(self.mktemp())

		c = d.child('p')
		c.makedirs()
		contents = 'function a() { return "A func"; }'
		c.child('mod1.js').setContent(contents)

		self.assertRaises(ValueError, lambda: jsimp.Script('p.mod1', d.path).scriptSrc())



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

// import p.last'''
		c.child('mod1.js').setContent(contents)

		self.assertEqual(
			['p', 'p.blah', 'p.other', 'p.last'],
			jsimp.Script('p.mod1', d.path)._getImportStrings())

	def test_getDependencies(self):
		d = FilePath(self.mktemp())
		d.makedirs()
		
		d.child('p.js').setContent('// import q\n// import r')
		d.child('q.js').setContent('// ')
		d.child('r.js').setContent('// ')

		p = jsimp.Script('p', d.path)
		q = jsimp.Script('q', d.path)
		r = jsimp.Script('r', d.path)

		self.assertEqual(
			[q, r],
			p.getDependencies())



class _DummyScript(object):
	"""A dummy for Script."""

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


	def getDependencies(self):
		# O(N^2)
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



# TODO: do we even need these integration tests? The integration is very simple.
class DependencyIntegrationTests(unittest.TestCase):

	def test_getDeps(self):
		d = FilePath(self.mktemp())
		d.makedirs()
		d.child('mod1.js').setContent("// import mod2\n//import modx")
		d.child('mod2.js').setContent("// import mod3")
		d.child('mod3.js').setContent("/* no import here */")
		d.child('modx.js').setContent("/* no import here */")

		mod1 = jsimp.Script('mod1', d.path)
		mod2 = jsimp.Script('mod2', d.path)
		mod3 = jsimp.Script('mod3', d.path)
		modx = jsimp.Script('modx', d.path)

		# There are many valid import orders for this, so this is implementation-specific.

		self.assertEqual(
			[modx, mod3, mod2, mod1],
			jsimp.getDeps(mod1)
		)


	def test_getDepsComplicated(self):
		p = FilePath(self.mktemp())
		p.makedirs()
		p.child('x.js').setContent("// import f")
		p.child('f.js').setContent("// import e\n//import c\n//import q")
		p.child('e.js').setContent("// import d\n//import b\n//import c")
		p.child('c.js').setContent("// import a")
		p.child('d.js').setContent("// import b\n//import z")
		p.child('b.js').setContent("// import a")
		p.child('a.js').setContent("// import z")
		p.child('z.js').setContent("/* no imports */")
		p.child('q.js').setContent("/* no imports */")

		for letter in 'x,f,e,c,d,b,a,z,q'.split(','):
			exec ('%s = jsimp.Script("%s", p.path)' % (letter, letter))

		# There are many valid import orders for this, so this is implementation-specific.
		# another valid order would be: z a b c d q e f x

		self.assertEqual(
			[q, z, a, c, b, d, e, f, x],
			jsimp.getDeps(x)
		)


	def test_getDepsComplicatedMore(self):
		x = FilePath(self.mktemp())
		x.makedirs()
		# 12 links total
		x.child('a.js').setContent("// import b")
		x.child('b.js').setContent("/* no imports */")
		x.child('c.js').setContent("// import q")
		x.child('d.js').setContent("// import q\n//import c")
		x.child('e.js').setContent("// import p\n// import d\n// import r\n// import s\n")
		x.child('p.js').setContent("// import s")
		x.child('q.js').setContent("// import a")
		x.child('r.js').setContent("// import b")
		x.child('s.js').setContent("// import c")

		for letter in 'a,b,c,d,e,p,q,r,s'.split(','):
			exec ('%s = jsimp.Script("%s", x.path)' % (letter, letter))

		# There are many valid import orders for this, so this is implementation-specific.
		# another valid order would be: z a b c d q e f x

		self.assertEqual(
			[b, a, q, c, s, r, d, p, e],
			jsimp.getDeps(e)
		)


	def test_getDepsCircularTwo(self):
		p = FilePath(self.mktemp())
		p.makedirs()
		p.child('a.js').setContent("// import b")
		p.child('b.js').setContent("// import a")

		a = jsimp.Script("a", p.path)
		b = jsimp.Script("b", p.path)

		self.assertRaises(
			jsimp.CircularDependencyError,
			lambda: jsimp.getDeps(a)
		)

		self.assertRaises(
			jsimp.CircularDependencyError,
			lambda: jsimp.getDeps(b)
		)


	def test_getDepsCircularThree(self):
		p = FilePath(self.mktemp())
		p.makedirs()
		p.child('a.js').setContent("// import b")
		p.child('b.js').setContent("// import c")
		p.child('c.js').setContent("// import a")

		a = jsimp.Script("a", p.path)

		self.assertRaises(
			jsimp.CircularDependencyError,
			lambda: jsimp.getDeps(a)
		)

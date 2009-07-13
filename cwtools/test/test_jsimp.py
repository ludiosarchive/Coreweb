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



class DependencyTests(unittest.TestCase):

	def test_getImports(self):
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


	def test_getAllDeps(self):
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

		self.assertEqual(
			{mod1: [mod2, modx], mod2: [mod3], mod3: [], modx: []},
			jsimp._getAllDeps([mod1])
		)


	def test_getAllDepsCircular(self):
		d = FilePath(self.mktemp())
		d.makedirs()
		d.child('mod1.js').setContent("// import mod2\n//import modx")
		d.child('mod2.js').setContent("// import mod3")
		d.child('mod3.js').setContent("/* no import here */")
		d.child('modx.js').setContent("// import mod1")

		mod1 = jsimp.Script('mod1', d.path)
		mod2 = jsimp.Script('mod2', d.path)
		mod3 = jsimp.Script('mod3', d.path)
		modx = jsimp.Script('modx', d.path)

		self.assertEqual(
			{mod1: [mod2, modx], mod2: [mod3], mod3: [], modx: [mod1]},
			jsimp._getAllDeps([mod1])
		)



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


# crap tests
#	def test_immutableDueToSlots(self):
#		x = jsimp.Script('p.mod1', '/tmp')
#		def setAttribute1():
#			x.asdfasdf = 4
#		# it would be raised even without the mean __setattr__ because of __slots__
#		self.assertRaises(TypeError, setAttribute1)
#
#
#	def test_immutableDueToSetattr(self):
#		x = jsimp.Script('p.mod1', '/tmp')
#		def setAttribute2():
#			x.name = 'newname'
#		# because it has a mean __setattr__
#		self.assertRaises(TypeError, setAttribute2)


	def test_putInSet(self):
		s = set()
		x1 = jsimp.Script('p.mod1', '/tmp')
		x2 = jsimp.Script('p.mod1', '/tmp')
		s.add(x1)
		s.add(x2)
		self.assertEqual(1, len(s))

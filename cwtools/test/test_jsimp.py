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
			jsimp.pathForModule("something.mod1", basePath=d.path))


	def test_fileDepth2(self):
		d = FilePath(self.mktemp())
		c = d.child('something').child('more')
		c.makedirs()
		c.child('mod2.js').setContent("// I am mod2")

		self.assertEqual(
			'something/more/mod2.js',
			jsimp.pathForModule("something.more.mod2", basePath=d.path))


	def test_fileDepth2WithInitJS(self):
		d = FilePath(self.mktemp())
		c = d.child('something').child('more')
		c.makedirs()
		c.child('__init__.js').setContent("// I am __init__")
		c.child('mod2.js').setContent("// I am mod2")

		self.assertEqual(
			'something/more/__init__.js',
			jsimp.pathForModule("something.more", basePath=d.path))

		self.assertEqual(
			'something/more/mod2.js',
			jsimp.pathForModule("something.more.mod2", basePath=d.path))


	def test_noSuchJS(self):
		d = FilePath(self.mktemp())

		self.assertRaises(
			jsimp.NoSuchJSError,
			lambda: jsimp.pathForModule("doesnt.exist", basePath=d.path))


	def test_noSuchJSInitJS(self):
		d = FilePath(self.mktemp())

		d.child('doesnt').child('exist').makedirs()

		self.assertRaises(
			jsimp.NoSuchJSError,
			lambda: jsimp.pathForModule("doesnt.exist", basePath=d.path))



class ScriptForTests(unittest.TestCase):

	def test_tags(self):
		d = FilePath(self.mktemp())

		c = d.child('p')
		c.makedirs()
		contents = 'function a() { return "A func"; }'
		c.child('mod1.js').setContent(contents)

		html = jsimp.scriptFor('p.mod1', basePath=d.path)
		self.assertEqual(
			"""<script>p.mod1={'__name__':'p.mod1'};%s</script>""" % (contents,),
			html
		)

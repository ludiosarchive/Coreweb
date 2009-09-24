# -*- coding: utf-8 -*-

import string

from twisted.python.filepath import FilePath
from twisted.trial import unittest

from cwtools import jsimp, htmltools



class CacheBreakerTests(unittest.TestCase):

	def test_cacheBreakerForPath(self):

		for i in xrange(10):
			tempFile = FilePath(self.mktemp())
			tempFile.setContent("nothing to see here")

			breaker = htmltools.cacheBreakerForPath(tempFile)

			# Breaker doesn't change
			for n in xrange(20):
				breakerAgain = htmltools.cacheBreakerForPath(tempFile)
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



class ScriptTagTests(unittest.TestCase):
	"""
	Tests for L{scriptContent} and L{scriptSrc}
	"""

	def test_scriptContent(self):
		d = FilePath(self.mktemp())

		c = d.child('p')
		c.makedirs()
		contents = 'function a() { return "A func"; }\n'
		c.child('mod1.js').setContent(contents)

		html = htmltools.scriptContent(jsimp.Script('p.mod1', d))
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

			script = jsimp.Script('p.mod1', d)
			html = htmltools.scriptSrc(script, mountedAt)

			self.assert_(
				html.startswith(
					"""<script>%s</script><script src="%s?""" % (
					script._underscoreName(), mountedAt + 'p/mod1.js')),
				html
			)

			self.assert_(
				html.endswith("""</script>\n"""),
				html
			)


	def test_scriptSrcError(self):
		d = FilePath(self.mktemp())

		c = d.child('p')
		c.makedirs()
		contents = 'function a() { return "A func"; }'
		c.child('mod1.js').setContent(contents)

		self.assertRaises(ValueError, lambda: htmltools.scriptSrc(jsimp.Script('p.mod1', d), u'bad-unicode-url'))


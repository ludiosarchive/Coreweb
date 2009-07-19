import jinja2

env = jinja2.Environment(
	line_statement_prefix = '//]',
	variable_start_string = '/**/',
	variable_end_string = '//',
	# also, block_(end|start)_string
	comment_start_string = '/*###',
	comment_end_string = '*/',
)


js = """\

// A comment.
A line, // a comment.

/**
 * Test that the message of L{compare}'s AssertionError describes the
 * failed the comparison based on its parameters.
 */
function test_compareDefaultMessage(self) {
	try {
		self.compare(function () {return false;}, "<->", "a", "b");
	} catch (e) {
		self.assert(CW.startswith(e.message, '[0] "a" <-> "b"'));
		/**/addEvent('document.body', 'click', 'somefunc')//
	}
}

//] if browser.supports('JSON'):
// Nothing to do, you've got JSON
//] else:
JSON = {};
//] endif

"""

class DontKnowError(Exception):
	pass


class ScriptGenerationFailedError(Exception):
	pass


class Browser(object):
	def supports(self, what):
		#d = dict(addEventListener=True, attachEvent=False, JSON=True)
		d = dict(addEventListener=False, attachEvent=True, JSON=False)
		b = d.get(what)
		if b is not None:
			return b
		else:
			raise DontKnowError("Never heard of %r." % (what,))


browser = Browser()

def addEvent(object, event, handler):
	if browser.supports('addEventListener'):
		return '%s.addEventListener("%s", %s, false)' % (object, event, handler)
	elif browser.supports('attachEvent'):
		return '%s.attachEvent("on%s", %s)' % (object, event, handler)
	else:
		raise ScriptGenerationFailedError("Need some way to attach an event.")


print env.from_string(js).render({'addEvent': addEvent, 'browser': browser})


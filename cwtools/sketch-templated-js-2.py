import jinja2

# These are chosen very carefully so that JS syntax-highlights reasonably
# even with these ugly macros.

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
var x = "something" // a comment.

/**
 * comments are fine.
 */

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


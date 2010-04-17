"""
An absolete macro system for JavaScript code. The design goal was to
be able to do things like `//] if internet_explorer: ... //] endif` and not
interfere with JavaScript syntax highlighting 99% of the time.

Then on 2009-11-03, Closure Compiler was released, making this
obsolete. Closure Compiler can compile code as if `variable` is
always true (or false). Another advantage of using normal JS `if`
statements is that your code doesn't need any server-side preprocessing
during development.
"""

import jinja2


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
			variable_start_string = '/***/',
			variable_end_string = '//',
			# TODO: ? also define block_(end|start)_string
			comment_start_string = '/*###',
			comment_end_string = '*/')


	def render(self, template, dictionary={}):
		"""
		C{template} is the unicode (or str) template.
		C{dictionary} is passed to jinja2 for variables in the template.

		@rtype: unicode
		@return: the rendered template
		"""
		rendered = self.env.from_string(template).render(dictionary)
		# jinja2 forgets about how many newlines there should be at the end, or something
		if not rendered.endswith(u'\n'):
			rendered += u'\n'
		return rendered


_theWriter = JavaScriptWriter()

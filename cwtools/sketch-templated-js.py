import jinja2

env = jinja2.Environment(
	line_statement_prefix = '//]',
	variable_start_string = '//{{',
	block_start_string = '//{%',
	comment_start_string = '//{#'
)
	

js = """\

//] for x in [1,2,3]:
	//{{x}}
//] endfor

//{{func('hi')}}

var something1 = '//{{func('x')}}';
var something2 = "//{{func('x')}}";

//] if browser == 'ie8':
'ie8!'
//] elif browser == 'ff3.5':
'ff3.5!'
//] else:
'whatever'
//] endif


//{%if browser == 'ie8'%}
'ie8!'
//{%elif browser == 'ff3.5'%}
'ff3.5!'
//{%else%}
'whatever'
//{%endif%}

"""


def func(s):
	return s*2

print env.from_string(js).render({'func': func, 'browser': 'ie8'})

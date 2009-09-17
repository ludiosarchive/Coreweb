// import CW

/**
 * This module is based on webmagic.uriparse, which is loosely
 * based on a patch attached to http://bugs.python.org/issue1462525
 */

CW.URI.URI_SPLIT_RE = /^(([^:\/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;

/*
	Basic URI Parser according to STD66 aka RFC3986

	>>> urisplit("scheme://authority/path?query#fragment")
	('scheme', 'authority', '/path', 'query', 'fragment')

	>>> urisplit("scheme://authority/path?query#")
	('scheme', 'authority', '/path', 'query', '')

	>>> urisplit("scheme://authority/path?query")
	('scheme', 'authority', '/path', 'query', None)

	>>> urisplit("scheme://authority/path?")
	('scheme', 'authority', '/path', '', None)

	>>> urisplit("scheme://authority/path")
	('scheme', 'authority', '/path', None, None)

	>>> urisplit("scheme://authority/")
	('scheme', 'authority', '/', None, None)

	>>> urisplit("scheme://authority")
	('scheme', 'authority', '', None, None)

	# auto-scheme-lowercasing

	>>> urisplit("SCHEME://authority")
	('scheme', 'authority', '', None, None)

	>>> urisplit("ScHeMe://authority")
	('scheme', 'authority', '', None, None)

	# reversability tests

	>>> uriunsplit(urisplit("scheme://authority"))
	'scheme://authority'

	>>> uriunsplit(urisplit("scheme://authority/"))
	'scheme://authority/'
 */
CW.URI.urisplit = function urisplit(uri) {
	var p = CW.URI.URI_SPLIT_RE.exec(uri);
	var parsed = [
		p[2], // scheme
		p[4], // authority
		p[5], // path
		p[7], // query
		p[9]  // fragment
	];
	if(parsed[0] == undefined) { // (or null)
		parsed[0] = parsed[0].toLowerCase();
	}
	return parsed;
}


/*
	Reverse of urisplit()

	This function signature does not match the one in webmagic;
	this one takes 5 arguments.

	>>> uriunsplit('scheme','authority','/path','query','fragment')
	'scheme://authority/path?query#fragment'

	>>> uriunsplit('scheme','authority','/path',None,'fragment')
	'scheme://authority/path#fragment'

	>>> uriunsplit('scheme','authority','/path','','fragment')
	'scheme://authority/path?#fragment'

	>>> uriunsplit('scheme','authority','/path','',None)
	'scheme://authority/path?'

	>>> uriunsplit('scheme','authority','/path','','')
	'scheme://authority/path?#'
 */

CW.URI.uriunsplit = function uriunsplit(scheme, authority, path, query, fragment) {
	// Keep in mind: a path might not start with /, for example, the path of 'about:blank' is 'blank'
	var result = '';
	if(scheme) {
		result += scheme + ':';
	}
	if(authority) {
		result += '//' + authority;
	}
	if(path) {
		result += path;
	}
	if(query != undefined) { // (or null)
		result += '?' + query;
	}
	if(fragment != undefined) { // (or null)
		result += '#' + fragment;
	}
	return result;
}

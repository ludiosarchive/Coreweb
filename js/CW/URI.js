// import CW

/**
 * This module is based on webmagic.uriparse, which is loosely
 * based on a patch attached to http://bugs.python.org/issue1462525
 */


// For reasons on why you shouldn't use regexes, see
// http://blog.stevenlevithan.com/archives/npcg-javascript
// http://blog.stevenlevithan.com/page/3

// Alternate parser that may or may not differentiate no query/fragment and blank query/fragment:
// http://blog.stevenlevithan.com/archives/parseuri
// http://stevenlevithan.com/demo/parseuri/js/

CW.URI.schemeToDefaultPort = {'http': 80, 'https': 443, 'ftp': 21};


/**
 * L{urisplit} is a basic URI Parser according to STD66 aka RFC3986.
 *
 * >>> CW.URI.urisplit("scheme://authority/path?query#fragment")
 * ['scheme', 'authority', '/path', 'query', 'fragment']
 *
 * See TestURI.js for the informal spec.
 */
CW.URI.urisplit = function urisplit(uri) {
	var scheme, authority = null, path = '', query = null, fragment = null, _rest, _split, _slashPos;

	_split = CW.split(uri, ":", 1);
	scheme = _split[0].toLowerCase();
	_rest = _split[1]; // _rest is now everything after the scheme

	if(CW.startswith(_rest, '//')) { // has an authority
		_slashPos = _rest.slice(2).indexOf('/');
		if(_slashPos !== -1) {
			authority = _rest.slice(2, _slashPos + 2);
			_rest = _rest.slice(_slashPos + 2);  // _rest is now everything after the authority
		} else {
			authority = _rest.slice(2);
			_rest = null; // started with "//" but no slash? then there cannot be a path, query, or fragment
		}
	}

	if(_rest) {
		// Must do # first, because of path#? -> fragment is "?"; path#?# -> fragment is "?#"
		_split = CW.split(_rest, '#', 1);
		//alert(_split.toSource())
		_rest = _split[0]; // _request is now path and query
		if(_split[1] !== undefined) {
			fragment = _split[1];
		}
	}

	if(_rest) {
		_split = CW.split(_rest, '?', 1);
		path = _split[0];
		if(_split[1] !== undefined) {
			query = _split[1];
		}
	}

	// scheme (there should always be a scheme)
	// authority (null if no authority)
	// path ("" if no path explicitly given)
	// query (no query -> null; "?" -> "", "?hello" -> "hello")
	// fragment (no fragment -> null; "#" -> "", "#hello" -> "hello")
	return [scheme, authority, path, query, fragment];
}



/**
 * Inverse of L{urisplit}.
 *
 * >>> CW.URI.uriunsplit('scheme', 'authority', '/path', 'query', 'fragment')
 * 'scheme://authority/path?query#fragment'
 *
 * See TestURI.js for the informal spec.
 */
CW.URI.uriunsplit = function uriunsplit(scheme, authority, path, query, fragment) {
	// Keep in mind: a path might not start with /, for example, the path of 'about:blank' is 'blank'
	var result = '';
	if(scheme) {
		result += scheme + ':';
	}
	if(authority !== null) {
		result += '//' + authority;
	}
	if(path) {
		result += path;
	}
	if(query !== null) {
		result += '?' + query;
	}
	if(fragment !== null) {
		result += '#' + fragment;
	}
	return result;
}



/**
 *  Basic authority parser that splits authority into component parts.
 * 
 * >>> CW.URI.split_authority("user:password@host:port")
 * ['user', 'password', 'host', port]
 *
 * See TestURI.js for the informal spec.
 */
CW.URI.split_authority = function split_authority(authority) {
	var split, userinfo, hostport, user, passwd, host, port;
	if(authority.indexOf('@') != -1) {
		split = CW.split(authority, '@', 1);
		userinfo = split[0];
		hostport = split[1];
	} else {
		userinfo = null;
		hostport = authority;
	}

	if(userinfo && userinfo.indexOf(':') != -1) {
		split = CW.split(userinfo, ':', 1);
		user = split[0];
		passwd = split[1];
	} else {
		user = userinfo;
		passwd = null;
	}

	if(hostport && hostport.indexOf(':') != -1) {
		split = hostport.split(':', 1)
		host = split[0];
		port = parseInt(split[1], 10);
	} else {
		host = hostport;
		port = null;
	}

	if(!host) {
		host = null;
	}

	return [user, passwd, host, port];
}


/**
 * Inverse of split_authority()
 * 
 * >>> CW.URI.join_authority('user', 'password', 'host', port)
 * 'user:password@host:port'
 *
 * See TestURI.js for the informal spec.
 */
CW.URI.join_authority = function join_authority(user, passwd, host, port) {
	var result = '';
	if (user !== null) {
		result += user;
		if (passwd !== null) {
			result +=  (':' + passwd);
		}
		result += '@';
	}
	result += host;
	if (port !== null) {
		result +=  (':' + port);
	}
	return result;
}


/**
 * Represents a URL. You can modify the public attributes on a L{CW.URI.URL}
 * to change parts of the URL, clone a URL by passing a L{CW.URI.URL} instance
 * into the constructor, and serialize to a string with C{.getString()}.
 */
CW.Class.subclass(CW.URI, 'URL').methods(
	/**
	 * C{urlObjOrString} must be
	 *          - an instance of L{CW.URI.URL}
	 * XOR   - any string, which will be parsed into a URL
	 */
	function __init__(self, urlObjOrString) {
		var split;
		var authority;

		if(urlObjOrString instanceof CW.URI.URL) {
			// Clone it. We don't expect the object to have any crappy values like undefined,
			// but even if that's the case, there shouldn't be many problems.
			self.scheme = urlObjOrString.scheme;
			self.user = urlObjOrString.user;
			self.passwd = urlObjOrString.passwd;
			self.host = urlObjOrString.host;
			self.port = urlObjOrString.port;
			self.path = urlObjOrString.path;
			self.query = urlObjOrString.query;
			self.frag = urlObjOrString.frag;
		} else {
			// Parse the (hopefully) string
			split = CW.URI.urisplit(urlObjOrString);
			self.scheme = split[0];
			authority = split[1];
			self.path = split[2]; // at this point, self.path could be C{null} XOR C{''}
			self.query = split[3];
			self.frag = split[4];

			split = CW.URI.split_authority(authority);
			self.user = split[0];
			self.passwd = split[1];
			self.host = split[2];
			self.port = split[3]; // at this point, self.port could be C{null} XOR C{''}
		}

		// This might become undefined.
		self._defaultPortForMyScheme = CW.URI.schemeToDefaultPort[self.scheme];

		if(!self.port) {
			if(self._defaultPortForMyScheme !== undefined) {
				self.port = self._defaultPortForMyScheme;
			}
		}

		if(!self.path) {
			self.path = '/';
		}
	},

	/**
	 * Think of this as the __str__, for when you really need it as a string.
	 */
	function getString(self) {
		/**
		 * Irreversibly normalizing an empty C{path} to C{'/'} is okay.
		 * Irreversibly normalizing a superfluous port :80 or :443 -> null is okay.
		 * 
		 * We'll keep C{user} and C{passwd} exactly as-is because that feature is scary.
		 */
		var port;
		if(self._defaultPortForMyScheme === self.port) {
			port = null;
		} else {
			port = self.port;
		}

		var authority = CW.URI.join_authority(self.user, self.passwd, self.host, port);
		return CW.URI.uriunsplit(self.scheme, authority, self.path, self.query, self.fragment);
	},

	/**
	 * Think of this as the __repr__
	 */
	function toString(self) {
		return 'CW.URI.URL("' + self.getString() + '")';
	}
);

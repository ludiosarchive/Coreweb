
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
 *
 * You must have a C{scheme}.
 * If you have no C{authority}, you must pass C{null}.
 * If you have no C{path}, pass C{''}
 * If you have no C{query}, pass C{null}
 * If you have no C{fragment}, pass C{null}
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
	result += path;
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
	var userinfo, hostport, user, password, host, port, _split;
	if(authority.indexOf('@') != -1) {
		_split = CW.split(authority, '@', 1);
		userinfo = _split[0];
		hostport = _split[1];
	} else {
		userinfo = null;
		hostport = authority;
	}

	if(userinfo && userinfo.indexOf(':') != -1) {
		_split = CW.split(userinfo, ':', 1);
		user = _split[0];
		password = _split[1];
	} else {
		user = userinfo;
		password = null;
	}

	if(hostport && hostport.indexOf(':') != -1) {
		_split = CW.split(hostport, ':', 1);
		host = _split[0];
		port = _split[1];
	} else {
		host = hostport;
		port = null;
	}

	// It really doesn't make sense to have an empty string for a host,
	// but do it anyway for symmetry.

	return [user, password, host, port];
}


/**
 * Inverse of split_authority()
 * 
 * >>> CW.URI.join_authority('user', 'password', 'host', port)
 * 'user:password@host:port'
 *
 * See TestURI.js for the informal spec.
 */
CW.URI.join_authority = function join_authority(user, password, host, port) {
	var result = '';
	if (user !== null) {
		result += user;
		if (password !== null) {
			result +=  (':' + password);
		}
		result += '@';
	}
	result += host;
	if (port !== null) {
		result +=  (':' + port);
	}
	return result;
}



CW.Error.subclass(CW.URI, "BadURLError").methods(
	function toString(self) {
		return 'BadURLError: ' + self.getMessage();
	}
);



/**
 * Represents a URL. You can modify a L{CW.URI.URL} with C{.update('property', 'value')}
 * to change parts of the URL, clone a URL by passing a L{CW.URI.URL} instance
 * into the constructor, and serialize to a string with C{.getString()}.
 *
 * Do not modify any of the "public" attributes yourself.
 *
 * If you create a URL without an explicit port set, and you never updated
 * the port yourself,
 *    AND you are changing the scheme,
 *          AND the scheme is in L{schemeToDefaultPort},
 *                the port of the URL will change.
 * 
 * This is to make it less error-prone to switch between http and https.
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

			// scheme must be set before port
			self.update('scheme', urlObjOrString.scheme, true);
			self.update('user', urlObjOrString.user, true);
			self.update('password', urlObjOrString.password, true);
			self.update('host', urlObjOrString.host, true);
			self.update('port', urlObjOrString.port, true);
			self.update('path', urlObjOrString.path, true);
			self.update('query', urlObjOrString.query, true);
			self.update('fragment', urlObjOrString.fragment, true);
			self._explicitPort = urlObjOrString._explicitPort;
		} else {
			self.port = null; // scary logic follows

			// Parse the (hopefully) string
			split = CW.URI.urisplit(urlObjOrString);
			// scheme must be set before port
			self.update('scheme', split[0], true);
			authority = split[1];
			self.update('path', split[2], true); // split[2] could be C{null} XOR C{''}
			self.update('query', split[3], true);
			self.update('fragment', split[4], true);

			split = CW.URI.split_authority(authority);
			self.update('user', split[0], true);
			self.update('password', split[1], true);
			self.update('host', split[2], true);
			if(split[3]) { // 0, null, or '';  sadly port 0 should be accepted, but whatever
				self.update('port', parseInt(split[3], 10), true); // at this point, self.port could be C{null} XOR C{''}
			}
		}

		if(!(self.scheme && self.host)) {
			throw new CW.URI.BadURLError("URL needs a scheme and a host");
		}
	},

	function _postPropertyUpdate_scheme(self, _internalCall) {
		self.scheme = self.scheme.toLowerCase();

		// This might become undefined.
		self._defaultPortForMyScheme = CW.URI.schemeToDefaultPort[self.scheme];

		if(!self._explicitPort) {
			if(self._defaultPortForMyScheme !== undefined) {
				// Note how we don't call self.update('port', ...), because that would set _explicitPort
				self.port = self._defaultPortForMyScheme;
			}
		}
	},

	function _postPropertyUpdate_path(self, _internalCall) {
		if(!self.path) {
			self.path = '/';
		}
	},

	function _postPropertyUpdate_port(self, _internalCall) {
		self._explicitPort = true;
	},

	/**
	 * Set URL C{property} to C{value}.
	 *
	 * Don't give this unknown property names.
	 *
	 * @return: C{this}
	 */
	function update(self, property, value, _internalCall/*=false*/) {
		self[property] = value;

		// Don't use dynamic self['_postPropertyUpdate_' + property] here,
		// to make it easier to rename private property names later.
		if(property === 'scheme') {
			self._postPropertyUpdate_scheme(_internalCall);
		} else if(property == 'path') {
			self._postPropertyUpdate_path(_internalCall);
		} else if(property == 'port') {
			self._postPropertyUpdate_port(_internalCall);
		}
		return this;
	},

	/**
	 * Think of this as the __str__, for when you really need it as a string.
	 */
	function getString(self) {
		/**
		 * Irreversibly normalizing an empty C{path} to C{'/'} is okay.
		 * Irreversibly normalizing a superfluous port :80 or :443 -> null is okay (but only for getString)
		 * 
		 * We'll keep C{user} and C{password} exactly as-is because that feature is scary.
		 */
		var port;
		if(!self.port || self._defaultPortForMyScheme === self.port) {
			port = null;
		} else {
			port = '' + self.port; // convert to a string for join_authority
		}

		var authority = CW.URI.join_authority(self.user, self.password, self.host, port);
		return CW.URI.uriunsplit(self.scheme, authority, self.path, self.query, self.fragment);
	},

	/**
	 * Think of this as the __repr__
	 */
	function toString(self) {
		// TODO: use a string repr function instead of replacing quotes
		return 'CW.URI.URL("' + self.getString().replace(/"/, '\\"') + '")';
	}
);

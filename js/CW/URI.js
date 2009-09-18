// import CW

/**
 * This module is based on webmagic.uriparse, which is loosely
 * based on a patch attached to http://bugs.python.org/issue1462525
 */

/**
 * There's an alternative MIT-licensed parser available at:
 *    http://blog.stevenlevithan.com/archives/parseuri
 *    http://stevenlevithan.com/demo/parseuri/js/
 */

// FFFFFFFFFF---
// http://blog.stevenlevithan.com/archives/npcg-javascript
// http://blog.stevenlevithan.com/page/3

// regex straight from STD 66 section B
CW.URI.URI_SPLIT_RE = /^(([^:\/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;

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
	var p = CW.URI.URI_SPLIT_RE.exec(uri);
	var parsed = [
		p[2], // scheme (there should always be a scheme)
		p[4], // authority (undefined or "" if no authority)
		p[5], // path (undefined or "" if no path) - TODO confirm
		p[6], // query (starting with ? if one exists)
		p[8]  // fragment (starting with # if one exists)
	];

	// "fix" authority if needed
	if(parsed[1] == "") { // IE sucks at NPCGs
		parsed[1] = null;
	}

	if(parsed[3].substr(0, 1) == "?") {
		parsed[3] = parsed[3].slice(1);
	} else {
		parsed[3] = null;
	}

	if(parsed[4].substr(0, 1) == "#") {
		parsed[4] = parsed[4].slice(1);
	} else {
		parsed[4] = null;
	}

	// lowercase scheme
	if(parsed[0] != undefined) { // (or null)
		parsed[0] = parsed[0].toLowerCase();
	}

	// do undefined -> null, for API sanity
	var n = 5; // parsed.length is always 5
	while(n--) {
		if(parsed[n] === undefined) {
			parsed[n] = null;
		}
	}
	return parsed;
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
	if(authority) {
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

/**
 * This module is based on webmagic.uriparse, which is loosely
 * based on a patch attached to http://bugs.python.org/issue1462525
 */

goog.require('goog.string');
goog.require('cw.string');

goog.provide('cw.URI');


// For reasons on why you shouldn't use regexes, see
// http://blog.stevenlevithan.com/archives/npcg-javascript
// http://blog.stevenlevithan.com/page/3

// Alternate parser that may or may not differentiate no query/fragment and blank query/fragment:
// http://blog.stevenlevithan.com/archives/parseuri
// http://stevenlevithan.com/demo/parseuri/js/

cw.URI.schemeToDefaultPort = {'http': 80, 'https': 443, 'ftp': 21};


/**
 * L{urisplit} is a basic URI Parser according to STD66 aka RFC3986.
 *
 * >>> cw.URI.urisplit("scheme://authority/path?query#fragment")
 * ['scheme', 'authority', '/path', 'query', 'fragment']
 *
 * See TestURI.js for the informal spec.
 */
cw.URI.urisplit = function(uri) {
	var scheme, authority = null, path = '', query = null, fragment = null, _rest, _split, _slashPos;

	_split = cw.string.split(uri, ":", 1);
	scheme = _split[0].toLowerCase();
	_rest = _split[1]; // _rest is now everything after the scheme

	if(goog.string.startsWith(_rest, '//')) { // has an authority
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
		_split = cw.string.split(_rest, '#', 1);
		_rest = _split[0]; // _request is now path and query
		if(_split[1] !== undefined) {
			fragment = _split[1];
		}
	}

	if(_rest) {
		_split = cw.string.split(_rest, '?', 1);
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
 * >>> cw.URI.uriunsplit('scheme', 'authority', '/path', 'query', 'fragment')
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
cw.URI.uriunsplit = function(scheme, authority, path, query, fragment) {
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
 * >>> cw.URI.split_authority("user:password@host:port")
 * ['user', 'password', 'host', port]
 *
 * See TestURI.js for the informal spec.
 */
cw.URI.split_authority = function(authority) {
	var userinfo, hostport, user, password, host, port, _split;
	if(authority.indexOf('@') != -1) {
		_split = cw.string.split(authority, '@', 1);
		userinfo = _split[0];
		hostport = _split[1];
	} else {
		userinfo = null;
		hostport = authority;
	}

	if(userinfo && userinfo.indexOf(':') != -1) {
		_split = cw.string.split(userinfo, ':', 1);
		user = _split[0];
		password = _split[1];
	} else {
		user = userinfo;
		password = null;
	}

	if(hostport && hostport.indexOf(':') != -1) {
		_split = cw.string.split(hostport, ':', 1);
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
 * >>> cw.URI.join_authority('user', 'password', 'host', port)
 * 'user:password@host:port'
 *
 * See TestURI.js for the informal spec.
 */
cw.URI.join_authority = function(user, password, host, port) {
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


/**
 * Represents a URL. You can modify a L{cw.URI.URL} with C{.update_('property', 'value')}
 * to change parts of the URL, clone a URL by passing a L{cw.URI.URL} instance
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
 *
 * 
 * C{urlObjOrString} must be
 *          - an instance of L{cw.URI.URL}
 * XOR   - any string, which will be parsed into a URL
 *
 * @constructor
 */
cw.URI.URL = function(urlObjOrString) {
	var self = this;
	var split;
	var authority;

	if(urlObjOrString instanceof cw.URI.URL) {
		// Clone it. We don't expect the object to have any crappy values like undefined,
		// but even if that's the case, there shouldn't be many problems.

		// We must use strings here like 'scheme' instead of .scheme,
		// so that the code is not broken by Closure Compiler's
		// ADVANCED_OPTIMIZATIONS.

		// scheme must be set before port.
		self.update_('scheme', urlObjOrString['scheme'], true);
		self.update_('user', urlObjOrString['user'], true);
		self.update_('password', urlObjOrString['password'], true);
		self.update_('host', urlObjOrString['host'], true);
		self.update_('port', urlObjOrString['port'], true);
		self.update_('path', urlObjOrString['path'], true);
		self.update_('query', urlObjOrString['query'], true);
		self.update_('fragment', urlObjOrString['fragment'], true);
		self.explicitPort_ = urlObjOrString.explicitPort_;
	} else {
		self['port'] = null; // scary logic follows

		// Parse the (hopefully) string
		split = cw.URI.urisplit(urlObjOrString);
		// scheme must be set before port
		self.update_('scheme', split[0], true);
		authority = split[1];
		self.update_('path', split[2], true); // split[2] could be C{null} XOR C{''}
		self.update_('query', split[3], true);
		self.update_('fragment', split[4], true);

		split = cw.URI.split_authority(authority);
		self.update_('user', split[0], true);
		self.update_('password', split[1], true);
		self.update_('host', split[2], true);
		if(split[3]) { // 0, null, or '';  sadly port 0 should be accepted, but whatever
			self.update_('port', parseInt(split[3], 10), true); // at this point, self.port could be C{null} XOR C{''}
		}
	}

	if(!(self['scheme'] && self['host'])) {
		throw new Error("URL needs a scheme and a host");
	}
}

/**
 * Whether this URL has an explicit port set (instead of an implied
 * 	port based on the scheme).
 * @type {boolean}
 * @private
 */
cw.URI.URL.prototype.explicitPort_ = false;

/**
 * The default port for the scheme that this URL currently has.
 * @type {number|undefined}
 * @private
 */
cw.URI.URL.prototype.defaultPortForMyScheme_;

cw.URI.URL.prototype._postPropertyUpdate_scheme = function(_internalCall) {
	var self = this;
	self['scheme'] = self['scheme'].toLowerCase();

	// This might become undefined.
	self.defaultPortForMyScheme_ = cw.URI.schemeToDefaultPort[self['scheme']];

	if(!self.explicitPort_) {
		if(self.defaultPortForMyScheme_ !== undefined) {
			// Note how we don't call self.update_('port', ...), because that would set explicitPort_
			self['port'] = self.defaultPortForMyScheme_;
		}
	}
}

cw.URI.URL.prototype._postPropertyUpdate_path = function(_internalCall) {
	var self = this;
	if(!self['path']) {
		self['path'] = '/';
	}
}

cw.URI.URL.prototype._postPropertyUpdate_port = function(_internalCall) {
	var self = this;
	self.explicitPort_ = true;
}

/**
 * Set URL C{property} to C{value}.
 *
 * Don't give this unknown property names.
 *
 * @return {cw.URI.URL} This URL object.
 */
cw.URI.URL.prototype.update_ = function(property, value, _internalCall/*=false*/) {
	var self = this;
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
}

/**
 * Think of this as the __str__, for when you really need it as a string.
 */
cw.URI.URL.prototype.getString = function() {
	var self = this;
	/**
	 * Irreversibly normalizing an empty C{path} to C{'/'} is okay.
	 * Irreversibly normalizing a superfluous port :80 or :443 -> null is okay (but only for getString)
	 *
	 * We'll keep C{user} and C{password} exactly as-is because that feature is scary.
	 */
	var port;
	if(!self['port'] || self.defaultPortForMyScheme_ === self['port']) {
		port = null;
	} else {
		port = '' + self['port']; // convert to a string for join_authority
	}

	var authority = cw.URI.join_authority(self['user'], self['password'], self['host'], port);
	return cw.URI.uriunsplit(self['scheme'], authority, self['path'], self['query'], self['fragment']);
}

/**
 * Think of this as the __repr__
 */
cw.URI.URL.prototype.toString = function() {
	var self = this;
	// TODO: use a string repr function instead of replacing quotes
	return 'cw.URI.URL("' + self.getString().replace(/"/, '\\"') + '")';
}

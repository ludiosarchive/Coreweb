/**
 * @fileoverview Module based on webmagic.uriparse, which is loosely
 *	based on a patch attached to http://bugs.python.org/issue1462525
 *
 * This module can accurately decode and encode URIs.
 *
 * For reasons why this doesn't use regexes, see
 * 	http://blog.stevenlevithan.com/archives/npcg-javascript
 * 	http://blog.stevenlevithan.com/page/3
 *
 * He has a parser which (probably) has the the empty-string NPCG problem:
 * 	http://blog.stevenlevithan.com/archives/parseuri
 *	http://stevenlevithan.com/demo/parseuri/js/
 *
 * Closure Library's URI parser uses NPCGs (as of 2010-03-06), and
 * therefore suffers from the blank string / null mixup in IE6-IE8
 * (IE9 untested).
 */

goog.provide('cw.uri');

goog.require('goog.string');
goog.require('cw.string');
goog.require('cw.repr');


/**
 * @type {!Object.<string, number>} scheme -> default port number.
 * @const
 */
cw.uri.schemeToDefaultPort = {'http': 80, 'https': 443, 'ftp': 21};


/**
 * A basic URI Parser according to STD66 aka RFC3986.
 *
 * >>> cw.uri.urisplit("scheme://authority/path?query#fragment")
 * ['scheme', 'authority', '/path', 'query', 'fragment']
 *
 * See TestURI.js for the informal spec.
 *
 * @param {string} uri URI to split into 5 components.
 * @return {!Array.<?string>} Splitted URI.
 */
cw.uri.urisplit = function(uri) {
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
};



/**
 * Inverse of {@link cw.uri.urisplit} (except taking 5 arguments
 * 	instead of an !Array).
 *
 * >>> cw.uri.uriunsplit('scheme', 'authority', '/path', 'query', 'fragment')
 * 'scheme://authority/path?query#fragment'
 *
 * >>> cw.uri.uriunsplit('scheme', 'authority', '/path', 'query', null)
 * 'scheme://authority/path?query#fragment'
 *
 * See TestURI.js for the informal spec.
 *
 * @param {string} scheme The scheme.
 * @param {?string} authority The authority; `null` if none.
 * @param {string} path The path, "" if none.
 * @param {?string} query The query part; `null` if none.
 * @param {?string} fragment The fragment part; `null` if none.
 *
 * @return {string} a URI.
 */
cw.uri.uriunsplit = function(scheme, authority, path, query, fragment) {
	// Keep in mind: a path might not start with /, for example,
	// the path of 'about:blank' is 'blank'
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
};



/**
 * Basic authority parser that splits authority into component parts.
 * 
 * >>> cw.uri.splitAuthority("user:password@host:port")
 * ['user', 'password', 'host', 'port']
 *
 * See TestURI.js for the informal spec.
 *
 * @param {string} authority Authority to split into 4 components.
 * @return {!Array.<string>} Splitted authority.
 */
cw.uri.splitAuthority = function(authority) {
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
};


/**
 * Inverse of {@link cw.uri.splitAuthority} (except taking 4 arguments
 * 	instead of an Array).
 * 
 * >>> cw.uri.joinAuthority('user', 'password', 'host', port)
 * 'user:password@host:port'
 *
 * See TestURI.js for the informal spec.
 *
 * @param {?string} user
 * @param {?string} password
 * @param {string} host
 * @param {?string} port
 *
 * @return {string} authority A joined authority.
 */
cw.uri.joinAuthority = function(user, password, host, port) {
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
};


/**
 * Represents a URL.  You can modify a it with
 * {@code .setUrlProperty('property', 'value')}.  You can clone a URL by
 * passing a {@link cw.uri.URL} instance into the constructor.
 * You serialize it to a string with {@code .toString()}.
 *
 * Do not modify any of the "public" attributes yourself.  Use
 * {@code setUrlProperty}.
 *
 * If you create a URL without an explicit port set, and you never updated
 * the port yourself,
 *    AND you are changing the scheme,
 *          AND the scheme is in L{schemeToDefaultPort},
 *                the port of the URL will change.
 * 
 * This makes it less annoying to switch between http and https.
 * 
 * @param {!cw.uri.URL|string} urlObjOrString Either a
 * 	{@code cw.uri.URL} or a string to be parsed into a URL.
 *
 * @constructor
 */
cw.uri.URL = function(urlObjOrString) {
	var split;

	if(urlObjOrString instanceof cw.uri.URL) {
		// Clone it.  We don't expect the object to have any crappy values like undefined,
		// but even if that's the case, there shouldn't be many problems.

		// We must use strings here like 'scheme' instead of .scheme,
		// so that the code is not broken by Closure Compiler's
		// ADVANCED_OPTIMIZATIONS.

		// scheme must be set before port.
		this.setUrlProperty('scheme', urlObjOrString['scheme'], true);
		this.setUrlProperty('user', urlObjOrString['user'], true);
		this.setUrlProperty('password', urlObjOrString['password'], true);
		this.setUrlProperty('host', urlObjOrString['host'], true);
		this.setUrlProperty('port', urlObjOrString['port'], true);
		this.setUrlProperty('path', urlObjOrString['path'], true);
		this.setUrlProperty('query', urlObjOrString['query'], true);
		this.setUrlProperty('fragment', urlObjOrString['fragment'], true);
		this.explicitPort_ = urlObjOrString.explicitPort_;
	} else {
		this['port'] = null; // scary logic follows

		// Parse the (hopefully) string
		split = cw.uri.urisplit(urlObjOrString);
		// scheme must be set before port
		this.setUrlProperty('scheme', split[0], true);
		var authority = split[1];
		this.setUrlProperty('path', split[2], true); // split[2] could be `null` XOR ""
		this.setUrlProperty('query', split[3], true);
		this.setUrlProperty('fragment', split[4], true);

		if(authority == null) {
			throw Error("URL needs an authority");
		}
		split = cw.uri.splitAuthority(authority);
		this.setUrlProperty('user', split[0], true);
		this.setUrlProperty('password', split[1], true);
		this.setUrlProperty('host', split[2], true);
		if(split[3]) { // 0, null, or '';  sadly port 0 should be accepted, but whatever
			this.setUrlProperty('port', parseInt(split[3], 10), true);
			// at this point, this['port'] could be `null` XOR ""
		}
	}

	if(!(this['scheme'] && this['host'])) {
		throw Error("URL needs a scheme and a host");
	}
};

/**
 * Whether this URL has an explicit port set (instead of an implied
 * 	port based on the scheme).
 * @type {boolean}
 * @private
 */
cw.uri.URL.prototype.explicitPort_ = false;

/**
 * The default port for the scheme that this URL currently has.
 * @type {number|undefined}
 * @private
 */
cw.uri.URL.prototype.defaultPortForMyScheme_;

/**
 * @private
 */
cw.uri.URL.prototype.postPropertyUpdate_scheme_ = function(_internalCall) {
	this['scheme'] = this['scheme'].toLowerCase();

	// Get port number or `undefined`
	this.defaultPortForMyScheme_ = cw.uri.schemeToDefaultPort[this['scheme']];

	if(!this.explicitPort_) {
		if(this.defaultPortForMyScheme_ != null) {
			// Note how we don't call this.setUrlProperty('port', ...), because that would set explicitPort_
			this['port'] = this.defaultPortForMyScheme_;
		}
	}
};

/**
 * @private
 */
cw.uri.URL.prototype.postPropertyUpdate_path_ = function(_internalCall) {
	if(!this['path']) {
		this['path'] = '/';
	}
};

/**
 * @private
 */
cw.uri.URL.prototype.postPropertyUpdate_port_ = function(_internalCall) {
	this.explicitPort_ = true;
};

/**
 * Set URL {@code property} to {@code value}.
 *
 * Don't give this unknown property names.
 *
 * @param {string} property URL property to set
 * @param {?(string|number)} value Value to set it to. `null` to clear.
 * @param {boolean=} _internalCall Don't use.
 *
 * @return {!cw.uri.URL} This URL object.
 */
cw.uri.URL.prototype.setUrlProperty = function(property, value, _internalCall) {
	this[property] = value;

	if(property == 'scheme') {
		this.postPropertyUpdate_scheme_(_internalCall);
	} else if(property == 'path') {
		this.postPropertyUpdate_path_(_internalCall);
	} else if(property == 'port') {
		this.postPropertyUpdate_port_(_internalCall);
	}
	return this;
};

/**
 * @return {string} This URL as a string.
 */
cw.uri.URL.prototype.toString = function() {
	/**
	 * Irreversibly normalizing an empty `path` to "/" is okay.
	 * Irreversibly normalizing a superfluous port :80 or :443 -> `null` is
	 * 	okay (but only for toString)
	 *
	 * We'll keep `user` and `password` exactly as-is because no one
	 * 	knows how to encode/decode those.
	 */
	var port;
	if(!this['port'] || this.defaultPortForMyScheme_ === this['port']) {
		port = null;
	} else {
		port = '' + this['port']; // convert to a string for joinAuthority
	}

	var authority = cw.uri.joinAuthority(this['user'], this['password'], this['host'], port);
	return cw.uri.uriunsplit(this['scheme'], authority, this['path'], this['query'], this['fragment']);
};

/**
 * @param {!Array.<string>} sb
 * @param {!Array.<*>} stack
 */
cw.uri.URL.prototype.__reprPush__ = function(sb, stack) {
	sb.push('cw.uri.URL(');
	cw.repr.reprPush(this.toString(), sb, stack);
	sb.push(')');
};

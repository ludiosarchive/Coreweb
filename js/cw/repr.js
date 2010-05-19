/**
 * @fileoverview Python-style repr() for JavaScript, supporting both
 * 	__repr__ and toString on objects.
 *
 * For primitive objects, the priority for deciding how to represent is:
 * 	- cw.repr internals
 *
 * For non-primitive objects that cw.repr understands, the priority is:
 * 	- .__repr__()
 * 	- cw.repr internals
 * 	- .toString()
 *
 * For non-primitive objects that cw.repr doesn't understand, the priority is:
 * 	- .__repr__()
 * 	- .toString()
 */

goog.provide('cw.repr');

goog.require('goog.json');


cw.repr.shortEscapes_ = {
	'\t':'t', // tab
	'\n':'n', // newline
	'\f':'f', // form feed
	'\r':'r' // carriage return

	// \v "short vertical tab" isn't here because IE6-IE8 doesn't
	// support it, so we leave it out everywhere for consistency.
};

/**
 * Escape a single character.
 *
 * @param {string} c {@code string} of length 1 to escape.
 * @return {string} The escaped character (the original character
 * 	with a prepended backslash	, or a short escape, or an \xHH or
 * 	\uHHHH escape).
 */
cw.repr.escapeChar = function(c) {
	if (c in cw.repr.shortEscapes_) {
		return '\\' + cw.repr.shortEscapes_[c];
	}
	var ord = c.charCodeAt(0);
	// The choice is to use \x escapes, and to uppercase the hex,
	// is based on .toSource() behavior in Firefox.
	if(ord < 0x10) {
		return '\\x0' + ord.toString(16).toUpperCase();
	} else if(ord < 0x20) {
		return '\\x' + ord.toString(16).toUpperCase();
	} else if(ord < 0x7F) {
		// Because this character is in the visible character range,
		// and we were asked to escape it anyway, just backslash it.
		return '\\' + c;
	} else if(ord < 0x100) {
		return '\\x' + ord.toString(16).toUpperCase();
	} else if(ord < 0x1000) {
		return '\\u0' + ord.toString(16).toUpperCase();
	} else {
		return '\\u'  + ord.toString(16).toUpperCase();
	}
};


var uneval_Array = function(o) {
	var src = [];
	for (var i = 0, l = o.length; i < l; i++) {
		src[i] = uneval(o[i], /*noParens*/true);
	}
	return '[' + src.toString() + ']';
}

var uneval_Object = function(o, noParens) {
	var src = []; // a-ha!
	for (var p in o){
		if (!hasOwnProperty.call(o, p)) {
			continue;
		}
		src.push(uneval(p, /*noParens*/true)  + ':' + uneval(o[p], /*noParens*/true));
	};
	// parens are only used for the outer-most object.
	if(noParens) {
		return '{' + src.toString() + '}';
	} else {
		return '({' + src.toString() + '})';
	}
}

var uneval_Anything = function(o) {
	if(o.__repr__ != null) {
		return o.__repr__();
	} else {
		return o.toString();
	}
}



/**
 * Return a string representation of an arbitrary value, similar to
 * Python's builtin repr() function.
 *
 * @private
 */
cw.repr.makeUneval_ = function() {
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	var protos = [];

	var name2uneval = {
		'array': uneval_Array,
		'object': uneval_Object,
		'boolean': uneval_Anything,
		'number': uneval_Anything,
		'string': function(o) {
			// regex is: control characters, double quote, backslash,
			return '"' + o.toString().replace(/[\x00-\x1F\"\\\u007F-\uFFFF]/g, cw.repr.escapeChar) + '"';
		},
		'null': function(o) {
			return 'null';
		},
		'undefined': function(o) {
			return 'undefined';
		},
		'function': uneval_Anything,
		'unknown': uneval_Anything /* IE-only */
	};

	// TODO: use __repr__, maybe also toSource
	var uneval = function(o, noParens) {
		if(goog.isDateLike(o)) {
			return '(new Date(' + o.valueOf() + '))';
		// We cannot properly detect RegExps from other frames/windows.
		} else if(o instanceof RegExp) {
			return o.toString();
		}

		var func = name2uneval[goog.typeOf(o)];
		return func(o, noParens);
	}

	return uneval;
}

cw.repr.repr = cw.repr.makeUneval_();

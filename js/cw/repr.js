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


var uneval_Array = function(o) {
	var src = [];
	for (var i = 0, l = o.length; i < l; i++) {
		src[i] = cw.repr.repr(o[i], /*noParens*/true);
	}
	return '[' + src.toString() + ']';
}

var uneval_Object = function(o, noParens) {
	var src = []; // a-ha!
	for (var p in o){
		if (!hasOwnProperty.call(o, p)) {
			continue;
		}
		src.push(cw.repr.repr(p, /*noParens*/true)  + ':' + cw.repr.repr(o[p], /*noParens*/true));
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
			var a = [];
			goog.json.Serializer.prototype.serializeString_(o, a);
			return a.join('');
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
	return function(o, noParens) {
		if(goog.isDateLike(o)) {
			return '(new Date(' + o.valueOf() + '))';
		// We cannot properly detect RegExps from other frames/windows.
		} else if(o instanceof RegExp) {
			return o.toString();
		}

		var func = name2uneval[goog.typeOf(o)];
		return func(o, noParens);
	}
}

cw.repr.repr = cw.repr.makeUneval_();

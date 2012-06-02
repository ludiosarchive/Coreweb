/**
 * @fileoverview Python-style repr() for JavaScript, supporting both
 * 	__repr__ and toString on objects.
 *
 * For primitive objects, the priority for deciding how to represent is:
 * 	- cw.repr internals
 *
 * For non-primitive objects that cw.repr understands, the priority is:
 * 	- .__reprPush__(sb)
 * 	- .__repr__()
 * 	- cw.repr internals
 *
 * For non-primitive objects that cw.repr doesn't understand, the priority is:
 * 	- .__reprPush__(sb)
 * 	- .__repr__()
 * 	- .toString()
 *
 * LICENSE note: copied some functions and comments from Closure Library's
 * goog.json.
 */

goog.provide('cw.repr');

goog.require('cw.func');
goog.require('goog.array');
goog.require('goog.json');
goog.require('goog.object');


/**
 * Serializes an array to a string representation.
 * @param {!Array} arr The array to serialize.
 * @param {!Array.<string>} sb Array used as a string builder.
 * @param {!Array.<*>} stack Array used to stop at a reference cycle.
 * @private
 */
cw.repr.serializeArray_ = function(arr, sb, stack) {
	var l = arr.length;
	sb.push('[');
	var sep = '';
	for (var i = 0; i < l; i++) {
		sb.push(sep)
		cw.repr.serializeAny_(arr[i], sb, stack);
		sep = ', ';
	}
	sb.push(']');
};



/**
 * Serializes an object to a string representation.
 * @param {!Object} obj The object to serialize.
 * @param {!Array.<string>} sb Array used as a string builder.
 * @param {!Array.<*>} stack Array used to stop at a reference cycle.
 * @private
 */
cw.repr.serializeObject_ = function(obj, sb, stack) {
	// For IE the for-in-loop (in getKeys) does not find any properties
	// that are not enumerable on the prototype object, so concat
	// PROTOTYPE_FIELDS_.  See goog.object.extend for information.
	var keys = goog.object.getKeys(obj).concat(goog.object.PROTOTYPE_FIELDS_);

	// Above concat may have added duplicate keys, so remove them.
	goog.array.removeDuplicates(keys);

	sb.push('{');
	var sep = '', key;
	for (var i = 0; i < keys.length; i++) {
		key = keys[i];
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			var value = obj[key];
			sb.push(sep);
			goog.json.Serializer.prototype.serializeString_(key, sb);
			sb.push(': ');
			cw.repr.serializeAny_(value, sb, stack);
			sep = ', ';
		}
	}

	sb.push('}');
};


/**
 * Serializes a Date to a string representation.
 * @param {! {valueOf: !Function} } obj The date to serialize.
 * @param {!Array.<string>} sb Array used as a string builder.
 * @private
 */
cw.repr.serializeDate_ = function(obj, sb) {
	sb.push('new Date(', String(obj.valueOf()), ')');
};



/**
 * Serializes anything to a string representation.
 * @param {*} obj The object to serialize.
 * @param {!Array.<string>} sb Array used as a string builder.
 * @param {!Array.<*>} stack Array used to stop at a reference cycle.
 * @private
 */
cw.repr.serializeAny_ = function(obj, sb, stack) {
	var stackPos = goog.array.indexOf(stack, obj);
	if(stackPos != -1) {
		sb.push('#CYCLETO:' + (stack.length - stackPos) + '#');
		return;
	}
	stack.push(obj);
	var type = goog.typeOf(obj);
	if(type == 'boolean' || type == 'number' || type == 'null' || type == 'undefined') {
		sb.push(String(obj));
	} else if(type == 'string') {
		goog.json.Serializer.prototype.serializeString_(/** @type {string} */ (obj), sb);
	} else {
		if(cw.func.isCallable(obj.__reprPush__)) {
			obj.__reprPush__(sb, stack);
		} else if(cw.func.isCallable(obj.__repr__)) {
			sb.push(obj.__repr__(stack));
		} else if(obj instanceof RegExp) {
			sb.push(obj.toString());
		} else if(type == 'array') {
			cw.repr.serializeArray_(/** @type {!Array} */ (obj), sb, stack);
		} else if(type == 'object') {
			// `getFullYear' check is identical to the one in goog.isDateLike
			if(goog.isDateLike(obj) && typeof obj.valueOf == 'function') {
				cw.repr.serializeDate_(/** @type {! {valueOf: !Function} } */ (obj), sb);
			} else {
				cw.repr.serializeObject_(/** @type {!Object} */ (obj), sb, stack);
			}
		} else { // ('function' or 'unknown') with no (__reprPush__ or __repr__)
			sb.push(obj.toString());
		}
	}
	stack.pop();
};


/**
 * Insert pieces of a string representation of an arbitrary value into
 * an Array.  Pieces will be pushed into the Array.  To get a human-readable
 * value, you must join the pieces yourself with {@code .join('')}.
 *
 * This may be useful if you are trying to avoid unnecessary string copies.
 *
 * @param {*} obj The object to serialize to a string representation.
 * @param {!Array.<string>} sb Array to use as a string builder.
 * 	May already have string values.
 * @param {!Array.<*>=} stack Array used to stop at a reference cycle.
 */
cw.repr.reprPush = function(obj, sb, stack) {
	if(!stack) {
		stack = [];
	}
	cw.repr.serializeAny_(obj, sb, stack);
};


/**
 * Return a string representation of an arbitrary value, similar to
 * Python's builtin repr() function.
 *
 * @param {*} obj The object to serialize to a string representation.
 * @param {!Array.<*>=} stack Array used to stop at a reference cycle.
 * @return {string} The string representation.
 */
cw.repr.repr = function(obj, stack) {
	var sb = [];
	cw.repr.reprPush(obj, sb, stack);
	return sb.join('');
};

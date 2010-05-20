/**
 * @fileoverview Generic equality comparisons, usable for both test code
 * 	and production code.
 */

// TODO XXX LICENSE: uses copy/pasted jsdocs from Closure Library

goog.provide('cw.eq');


cw.eq.isPrimitive_ = function(type) {
	return (type == 'boolean' || type == 'number' || type == 'null' ||
		type == 'undefined' || type == 'string');
}


/**
 * Compares two Arrays for equality. They are considered equal if they
 * have the same length and their corresponding elements are equal according to
 * {@code cw.eq.eqAny_}.
 *
 * @param {!Array} one The first array to compare.
 * @param {!Array} two The second array to compare.
 * @param {!Array.<string>} messages Array to push comparison progress
 * 	messages into.
 * @return {boolean} Whether the two arrays are equal.
 * @private
 */
cw.eq.eqArray_ = function(one, two, messages) {
	messages.push('descending into array');
	if(one.length != two.length) {
		messages.push('array length mismatch: ' + one.length + ', ' + two.length);
		return false;
	}
	for (var i=0, len=one.length; i < len; i++) {
		if (!cw.eq.eqAny_(one[i], two[i], messages)) {
			messages.push('earlier comparisons indicate mismatch at array item #' + i);
			return false;
		}
	}
	messages.push('ascending from array');
	return true;
}


/**
 * Compares two Objects for equality. They are considered equal if they
 * have the same properties and the value for each property is equal according
 * to {@code cw.eq.eqAny_}.
 *
 * @param {!Object} one The first object to compare.
 * @param {!Object} two The second object to compare.
 * @param {!Array.<string>} messages Array to push comparison progress
 * 	messages into.
 * @return {boolean} Whether the two objects are equal.
 * @private
 */
cw.eq.eqObject_ = function(one, two, messages) {
	messages.push('descending into object');
	for(var prop in one) {
		if(!(prop in two)) {
			messages.push('property ' + prop + ' missing on right object');
			return false;
		}
		if(!cw.eq.eqAny_(one[prop], two[prop], messages)) {
			messages.push('earlier comparisons indicate mismatch at property ' + prop);
			return false;
		}
	}

	for(var prop in two) {
		if(!(prop in one)) {
			messages.push('property ' + prop + ' missing on left object');
			return false;
		}
	}
	messages.push('ascending from object');
	return true;
}


/**
 * Compare any two objects for equality.
 *
 * @private
 *
 * For more inspiration, see:
 * 	http://philrathe.com/articles/equiv and qunit/testrunner.js
 * 	Closure Library's goog.testing.asserts
 */
cw.eq.eqAny_ = function(one, two, messages) {
	var typeOne = goog.typeOf(one);
	var typeTwo = goog.typeOf(two);

	// We allow custom .equals comparisons where the other side is a
	// primitive value.
	// TODO: consider not letting right-side .equals override comparison
	// with a primitive value. Look at what Python does.

	if(one != null && typeof one.equals == 'function') {
		messages.push('running custom equals function on left object');
		return one.equals(two, messages);

	} else if(two != null && typeof two.equals == 'function') {
		messages.push('running custom equals function on right object');
		return two.equals(one, messages);

	} else if(cw.eq.isPrimitive_(typeOne) || cw.eq.isPrimitive_(typeTwo)) {
		return one === two;

	} else if(one instanceof RegExp && two instanceof RegExp) {
		return one.toString() === two.toString();

	} else if(goog.isDateLike(one) && goog.isDateLike(two)) {
		return one.valueOf() === two.valueOf();

	} else if(typeOne == 'array' && typeTwo == 'array') {
		return cw.eq.eqArray_(
			/** @type {!Array} */ (one),
			/** @type {!Array} */ (two),
			messages);

	// TODO: support various {goog.struct}s, like goog.testing.asserts does.
	// TODO: die on objects with __iterator__, like goog.testing.asserts does.

	} else if(typeOne == 'object' && typeTwo == 'object') {
		return cw.eq.eqObject_(
			/** @type {!Object} */ (one),
			/** @type {!Object} */ (two),
			messages);

	} else {
		return one === two;
	}
}


/**
 * @type {!Object.<string, !Function>}
 * @private
 */
cw.eq.NOOP_PUSHABLE_ = {'push': goog.nullFunction};


/**
 * Compare any two objects for deep equality. This properly compares many
 * built-in types, but also supports the Closure Library-style equality protocol:
 * If any object or sub-object has an {@code equals} method, it will be used
 * to check for equality. The {@code equals} method is called with two arguments:
 * 	#0 the other object
 * 	#1 an Array into which comparison progress messages are pushed in to.
 * This is backwards-compatible with {@code equals} methods that take only
 * 	argument #0.
 *
 * @param {!Object} one The first object to compare.
 * @param {!Object} two The second object to compare.
 * @param {Array.<string>=} messages Array into which comparison progress
 * 	messages are pushed in to.
 * @return {boolean} Whether the two objects are equal.
 */
cw.eq.equals = function(one, two, messages) {
	// If messages is null or undefined, assume caller doesn't want
	// comparison progress messages.
	if(messages == null) {
		messages = cw.eq.NOOP_PUSHABLE_;
	}
	return cw.eq.eqAny_(one, two, messages);
}

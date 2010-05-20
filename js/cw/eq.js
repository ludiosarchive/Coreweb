/**
 * @fileoverview Generic equality comparisons, usable for both test code
 * 	and production code.
 */

// TODO XXX LICENSE: uses copy/pasted jsdocs from Closure Library

cw.provide('cw.eq');


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
	if(one.length != two.length) {
		messages.push('array length mismatch: ' + one + ', ' + two);
		return false;
	}
	for (var i = 0, len = one.length; i < len; i++) {
		if (!cw.eq.eqAny_(one[i], two[i])) {
			messages.push('earlier comparisons indicate mismatch at array item #' + i);
			return false;
		}
	}
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

}


/**
 * Compare any two objects for equality.
 *
 * @private
 *
 * For more inspiration, see:
 * 	http://philrathe.com/articles/equiv and qunit/testrunner.js
 * 	Closure Library's
 */
cw.eq.eqAny_ = function(one, two, messages) {
	var typeOne = goog.typeOf(one);
	var typeTwo = goog.typeOf(two);

	if(cw.repr.isPrimitive_(typeOne)) {
		return one === two;

	} else if(typeof one.equals == 'function') {
		// We aim to be backwards-compatible with `equals` methods
		// that do not take a `messages` argument.
		messages.push('running custom equals function');
		return one.equals(two, messages);

	} else if(one instanceof RegExp && two instanceof RegExp) {
		return one.toString() === two.toString();

	} else if(goog.isDateLike(one) && goog.isDateLike(two)) {
		return one.valueOf() === two.valueOf();

	} else if(typeOne == 'array' && typeTwo == 'array') {
		messages.push('descending into array');
		return cw.eq.eqArray_(one, two, messages);

	} else if(typeOne == 'object' && typeTwo == 'object') {
		messages.push('descending into object');
		return cw.eq.eqObject_(one, two, messages);

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
 * Compare any two objects for equality.
 * 
 * @param {!Object} one The first object to compare.
 * @param {!Object} two The second object to compare.
 * @param {Array.<string>=} messages Array to push comparison progress
 * 	messages into.
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

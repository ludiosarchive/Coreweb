/**
 * @fileoverview Generic equality comparisons, usable for both test code
 * 	and production code.
 *
 * LICENSE note: includes copy/pasted JSDocs from Closure Library.
 */

goog.provide('cw.eq');

goog.require('goog.functions');


/**
 * Implementation details: The function is never actually called by cw.eq;
 * it is just used as a marker value.  We reuse an existing object to
 * possibly reduce the number of objects allocated in IE.
 * @type {function(...): boolean}
 * @private
 */
cw.eq.IT_IS_PLAIN_ = goog.functions.TRUE;


/**
 * Mark {@code object} as a plain object and return the mutated object.
 *
 * @param {!Object} object
 * @return {!Object} The mutated object
 */
cw.eq.plainObject = function(object) {
	// We use a function because things like goog.json and
	// cw.externalinterface skip over functions.
	object.__isPlainObject__ = cw.eq.IT_IS_PLAIN_;
	return object;
};


/**
 * {@link cw.eq.equals} treats {@link cw.eq.Wildcard} as equal to anything.
 * @type {!Object}
 */
cw.eq.Wildcard = {};
cw.eq.Wildcard.toString = function() {
	return '<cw.eq.Wildcard>';
};


/**
 * Like {@link cw.eq.plainObject}, except recursively mark everything that
 * is {@code goog.typeOf(...) == 'object'} as a plain object.
 *
 * @param {*} object
 * @return {*} The mutated object (with mutated objects)
 */
cw.eq.plainObjectRecursive = function(object) {
	var type = goog.typeOf(object);
	if(type == 'object') {
		cw.eq.plainObject(/** @type {!Object} */ (object));
		for(var k in object) {
			cw.eq.plainObjectRecursive(object[k]);
		}
	} else if(type == 'array') {
		// Don't mark it, but descend it.
		for (var i=0, len=object.length; i < len; i++) {
			cw.eq.plainObjectRecursive(object[i]);
		}
	}
	return object;
};


/**
 * Compares two Arrays for equality.  They are considered equal if they
 * have the same length and their corresponding elements are equal according to
 * {@code cw.eq.eqAny_}.
 *
 * @param {!Array} one The first array to compare.
 * @param {!Array} two The second array to compare.
 * @param {Array.<string>=} eqLog Array to push comparison progress
 * 	messages into.
 * @return {boolean} Whether the two arrays are equal.
 * @private
 */
cw.eq.eqArray_ = function(one, two, eqLog) {
	if(eqLog) {
		eqLog.push('descending into array');
	}
	if(one.length != two.length) {
		if(eqLog) {
			eqLog.push('array length mismatch: ' + one.length + ', ' + two.length);
		}
		return false;
	}
	for (var i=0, len=one.length; i < len; i++) {
		if (!cw.eq.eqAny_(one[i], two[i], eqLog)) {
			if(eqLog) {
				eqLog.push('earlier comparisons indicate mismatch at array item #' + i);
			}
			return false;
		}
	}
	if(eqLog) {
		eqLog.push('ascending from array');
	}
	return true;
};


/**
 * Compares two plain Objects for equality.  They are considered equal if they
 * have the same properties and the value for each property is equal according
 * to {@code cw.eq.eqAny_}.
 *
 * @param {!Object} one The first object to compare.
 * @param {!Object} two The second object to compare.
 * @param {Array.<string>=} eqLog Array to push comparison progress
 *  messages into.
 * @return {boolean} Whether the two objects are equal.
 * @private
 */
cw.eq.eqPlainObject_ = function(one, two, eqLog) {
	if(eqLog) {
		eqLog.push('descending into object');
	}
	for(var prop in one) {
		if(!(prop in two)) {
			if(eqLog) {
				eqLog.push('property ' + prop + ' missing on right object');
			}
			return false;
		}
		if(!cw.eq.eqAny_(one[prop], two[prop], eqLog)) {
			if(eqLog) {
				eqLog.push('earlier comparisons indicate mismatch at property ' + prop);
			}
			return false;
		}
	}

	for(var prop in two) {
		if(!(prop in one)) {
			if(eqLog) {
				eqLog.push('property ' + prop + ' missing on left object');
			}
			return false;
		}
	}
	if(eqLog) {
		eqLog.push('ascending from object');
	}
	return true;
};


/**
 * @param {string} type The return value from the `typeof` operator
 * 	or from {@link goog.typeOf}.
 * @return {boolean}
 */
cw.eq.isPrimitive_ = function(type) {
	return (type == 'boolean' || type == 'number' || type == 'null' ||
		type == 'undefined' || type == 'string');
};


/**
 * Compare any two objects for equality.
 *
 * @param {*} one The first object to compare.
 * @param {*} two The second object to compare.
 * @param {Array.<string>=} eqLog Array into which comparison progress
 * 	messages are pushed in to.
 * @return {boolean} Whether the two objects are equal.
 * @private
 *
 * For more (possibly terrible) inspiration, see:
 * 	http://philrathe.com/articles/equiv and qunit/testrunner.js
 * 	Closure Library's goog.testing.asserts
 */
cw.eq.eqAny_ = function(one, two, eqLog) {
	var typeOne = goog.typeOf(one);
	var typeTwo = goog.typeOf(two);

	if(one == cw.eq.Wildcard || two == cw.eq.Wildcard) {
		return true;
	// See the JSDoc for cw.eq.equals. We let `equals` on either side to
	// claim the object is equal to a primitive object.
	} else if(one != null && typeof one.equals == 'function') {
		if(eqLog) {
			eqLog.push('running custom equals function on left object');
		}
		return one.equals(two, eqLog);

	} else if(two != null && typeof two.equals == 'function') {
		if(eqLog) {
			eqLog.push('running custom equals function on right object');
		}
		return two.equals(one, eqLog);

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
			eqLog);

	} else if(
	one.__isPlainObject__ == cw.eq.IT_IS_PLAIN_ &&
	two.__isPlainObject__ == cw.eq.IT_IS_PLAIN_) {
		return cw.eq.eqPlainObject_(
			/** @type {!Object} */ (one),
			/** @type {!Object} */ (two),
			eqLog);

	// TODO: support various {goog.struct}s, like goog.testing.asserts does.
	// TODO: die on objects with __iterator__, like goog.testing.asserts does.
	// ^ __iterator__ problem still applicable after the 2010-06-20 change?

	} else { // 'object', 'unknown', etc
		return one === two;
	}
};


/**
 * Compare any two objects for equality.  Arrays are deep-compared by
 * default, but plain objects and constructed objects are not (though you can
 * override the behavior for any object).
 *
 * This properly compares many built-in types, but also supports an equality
 * protocol: If any object or sub-object has an {@code equals} method, it will
 * be used to check for equality.  The {@code equals} method is called in
 * the context of the left object with two arguments:
 * 	#0 the right object
 * 	#1 an Array into which comparison progress messages are pushed in to.
 * In the `equals` method, return `true` if equal, `false` otherwise. You may
 * also push strings into the `eqLog`.
 *
 * The `equals` function on the left object takes priority over the `equals`
 * object on the right function.  If the left object is a primitive object, the
 * `equals` function on the right object is still tried.  Thus a right-side
 * `new FancyObject(3)` can claim it is equivalent to `3`.
 *
 * If you want to deep-compare objects by iterating through their properties,
 * first call {@link cw.eq.plainObject} on both objects to mark them as plain
 * objects.
 *
 * Also, you can use {@link cw.eq.Wildcard} to avoid comparing certain objects,
 * like this:
 * cw.eq.equals({'a': 1, 'b': 2}, {'a': 1, 'b': cw.eq.Wildcard}) -> true
 *
 * @param {*} one The first object to compare.
 * @param {*} two The second object to compare.
 * @param {Array.<string>=} eqLog Array into which comparison progress
 * 	messages are pushed in to.
 * @return {boolean} Whether the two objects are equal.
 */
cw.eq.equals = function(one, two, eqLog) {
	return cw.eq.eqAny_(one, two, eqLog);
};


// Implementation note: an older cw.eq.equals (2010-06-20) previously
// deep-compared plain objects and constructed objects by default,
// but the properties of constructed objects were often causing very deep
// and incorrect comparisons.  Sometimes these objects are defined in other
// people's code, so it is not correct to just add an `equals` method.
// I investigated ways of telling apart plain objects and constructed objects,
// so that I could deep-compare plain objects but use === by default for
// constructed objects.  There did not seem to be a a good way of telling
// apart plain objects and constructed objects.  Because of this, I decided
// to remove the default behavior of deep-comparison for all 'object's.
//
// Some people still insist on trying to tell them apart, and you'll find
// things like the incorrect `isPlainObject` in jQuery, and all sorts of
// flailing attempts:
//
// http://stackoverflow.com/questions/1173549/how-to-determine-if-an-object-is-an-object-literal-in-javascript
// http://www.google.com/search?q=isObjectLiteral
// http://code.eligrey.com/testcases/all/isObjectLiteral.html

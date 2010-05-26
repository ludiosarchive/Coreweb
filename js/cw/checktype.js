/**
 * @fileoverview Functions to check the type of objects, based on mypy.objops.
 */


goog.provide('cw.checktype');

goog.require('goog.math');


/**
 * Returns {@code value} is value is a finite integer,
 * else returns {@code null}.
 *
 * @param {*} value
 * @return {?number}
 */
cw.checktype.ensureInt = function(value) {
	if(typeof value == "number" &&
	goog.math.isInt(/** @type {number} */ (value))) {
		return value;
	}
	return null;
};


/**
 * Returns {@code value} is value is a finite integer and within inclusive
 * range {@code [a to b]}, else returns {@code null}.
 *
 * @param {*} value
 * @param {number} min Lower bound allowed for the number.
 * @param {number} max Upper bound allowed for the number.
 * @return {?number}
 */
cw.checktype.ensureIntInRange = function(value, min, max) {
	if(typeof value == "number" &&
	goog.math.isInt(/** @type {number} */ (value)) &&
	value >= min &&
	value <= max) {
		return value;
	}
	return null;
};


/**
 * Convert `1` and `true` to `true`.
 * Convert `0`, `-0` and `false` to `false`.
 * For all other values, return `null`
 *
 * @param {*} value
 * @return {?boolean} boolean equivalent of {@code value}, or {@code null}.
 */
cw.checktype.ensureBool = function(value) {
	if(value === true || value === 1) {
		return true;
	} else if(value === false || value === 0) {
		return false;
	}
	return null;
}

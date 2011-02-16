/**
 * @fileoverview More string utilities
 */

goog.provide('cw.string');

goog.require('goog.asserts');


/**
 * Like Python's s.split(delim, num) and s.split(delim)
 * This does *NOT* implement Python's no-argument s.split()
 *
 * @param {string} s The string to split.
 * @param {string} sep The separator to split by.
 * @param {number} maxsplit Maximum number of times to split.
 *
 * @return {!Array.<string>} The splitted string, as an array.
 */
cw.string.split = function(s, sep, maxsplit) {
	goog.asserts.assert(goog.isDef(sep),
		"arguments[1] of cw.string.split must be a separator string");
	if(maxsplit === undefined || maxsplit < 0) {
		return s.split(sep);
	}
	var pieces = s.split(sep);
	var head = pieces.splice(0, maxsplit);
	// after the splice, pieces is shorter and no longer has the C{head} elements.
	if(pieces.length > 0) {
		var tail = pieces.join(sep);
		head.push(tail); // no longer just the head.
	}
	return head;
};



/**
 * Like Python 2.6+ str.format, except no support auto-numbering.
 * Any literal "{}" will be left untouched.
 *
 * Examples:
 * 	var url = cw.string.format("{0}{1}.{2}/index.html", arg1, arg2, arg3);
 * 	var yx = cw.string.format("{1}{0}", "x", "y");
 *
 * See also {@code goog.string.subs}, which uses %s'es
 *
 * @param {string} _string The string containing the pattern.
 * @param {...string} var_args The items to substitute into the pattern.
 *
 * @return {string} The string with substitutions made.
 */
cw.string.format = function(_string, var_args) { // arguments only for Closure Compiler
	var values = Array.prototype.slice.call(arguments);
	var string = values.shift();
	return string.replace(/\{(\d+)\}/g, function(_ignored, which) {
		return values[which];
	});
};



/**
 * String prefix checker.
 *
 * Use this instead of {@code goog.string.startsWith} if your {@code str}
 * is big and it is unlikely to start with {@code start}
 *
 * @param {string} str The string to check.
 * @param {string} prefix A string to look for at the start of {@code str}.
 *
 * @return {boolean} True if {@code str} begins with {@code prefix}.
 */
cw.string.startsWithAlt = function(str, prefix) {
	 // '==' works the same as '===' in this case
	return !!(str.substr(0, prefix.length) == prefix);
};


/**
 * Returns a string with at least 63 bits of randomness.  Unlike
 * {@link goog.string.getRandomString}, returned strings never contain
 * a dash ("-").
 *
 * Doesn't trust Javascript's random function entirely.  Uses a combination of
 * random and current timestamp, and then encodes the string in base-36 to
 * make it shorter.
 *
 * @return {string} A random string, e.g. "sn1s7vb4gcic".
 */
cw.string.getCleanRandomString = function() {
	return Math.floor(Math.random() * 2147483648).toString(36) +
		Math.abs(Math.floor(Math.random() * 2147483648) ^ goog.now()).toString(36);
};


/**
 * Return the string with the last N characters truncated.
 *
 * @param {string} str String to truncate
 * @param {number} num How many characters to remove from the end.
 *
 * @return {string} The truncated string
 */
cw.string.withoutLast = function(str, num) {
	return str.substr(0, str.length  - num);
};


/**
 * RegExp to match positive integers that start with [1-9].
 * This does *not* match "0".
 * @type {!RegExp}
 * @const
 */
cw.string.strictPositiveIntegerRe = /^[1-9]\d*$/;


/**
 * RegExp to match non-negative integers.
 * This does not match "-0".
 * @type {!RegExp}
 * @const
 */
cw.string.strictNonNegIntegerRe = /^(0|[1-9]\d*)$/;


/**
 * RegExp to match integers.
 * This does not match "-0".
 * @type {!RegExp}
 * @const
 */
cw.string.strictIntegerRe = /^(0|\-?[1-9]\d*)$/;


/**
 * A strict string->non-negative integer converter based on
 * {@code mypy.objops.strToNonNegLimit}.
 *
 * @param {string} str String to convert to non-negative integer.
 * @param {number} limit Upper bound for the number.
 * @return {number|null} The number, or null, if it could not be converted.
 */
cw.string.strToNonNegLimit = function(str, limit) {
	if(cw.string.strictNonNegIntegerRe.test(str)) {
		var num = parseInt(str, 10);
		if(num <= limit) {
			return num;
		}
	}
	return null;
};


/**
 * A strict numeric-string to integer converter based on
 * {@code mypy.objops.strToIntInRange}.
 *
 * @param {string} str String to convert to an integer.
 * @param {number} lower Lower bound for the number.
 * @param {number} upper Upper bound for the number.
 * @return {number|null} The number, or null, if it could not be converted.
 */
cw.string.strToIntInRange = function(str, lower, upper) {
	if(cw.string.strictIntegerRe.test(str)) {
		var num = parseInt(str, 10);
		if(num >= lower && num <= upper) {
			return num;
		}
	}
	return null;
};

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
 * @return {Array.<string>} The splitted string, as an array.
 */
cw.string.split = function(s, sep, maxsplit) {
	goog.asserts.assert(goog.isDef(sep), "arguments[1] of CW.split must be a separator string");
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

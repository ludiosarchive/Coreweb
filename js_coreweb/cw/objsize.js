/**
 * @fileoverview Functions to guess how much memory an object is using.
 */

goog.provide('cw.objsize');

/**
 * Returns a guess of how much memory an object is using.
 *
 * Estimates of object size are based on what 32-bit CPython 2.7
 * `sys.getsizeof` returns, which may or may not resemble JavaScript engines.
 *
 * @param {*} obj Any object.
 * @return {number} Approximately how many bytes of memory the object is using.
 */
cw.objsize.totalSizeOf = function(obj) {
	var type = goog.typeOf(obj);
	if(type == 'string') {
		// Assume the UTF-16 string is using 2 bytes per codepoint.
		return 21 + 2 * obj.length;
	} else if(type == 'number') {
		return 16;
	} else if(type == 'boolean') {
		return 12;
	} else if(type == 'null' || type == 'undefined') {
		return 8;
	} else {
		// TODO: support arrays
		throw Error("cannot determine size of object type " + type);
	}
};

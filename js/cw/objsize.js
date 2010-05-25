/**
 * @fileoverview Port of mypy.objops.totalSizeOf
 */

goog.provide('cw.objsize');

/**
 * Returns a guess of how much memory an object is using.
 *
 * @param {*} obj Any object.
 * @return {number} Approximately how many bytes of memory the object is using.
 */
cw.objsize.totalSizeOf = function(obj) {
	var type = goog.typeOf(obj);
	if(type == 'string') {
		// We just hope that the UTF-16 string mostly has 2-byte characters
		// and not 4-byte characters.
		return 64/8 + 2 * obj.length;
	} else if(type == 'null' || type == 'number' || type == 'boolean' || type == 'undefined') {
		return 64/8;
	} else {
		// TODO: support arrays
		throw new Error("cannot determine size of object type " + type);
	}
}

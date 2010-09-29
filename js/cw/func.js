/**
 * @fileoverview
 */

goog.provide('cw.func');

/**
 * Determines whether {@code obj} is probably callable.  This works even on
 * objects that IE has proxied because it came from another window (IE proxies
 * objects from other windows but not iframes).
 * @param {*} obj
 */
cw.func.isCallable = function(obj) {
	return goog.isFunction(obj) || (
		typeof obj == 'object' &&
		goog.isFunction(obj.call) &&
		goog.isFunction(obj.apply))
};

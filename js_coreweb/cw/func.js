/**
 * @fileoverview
 */

goog.provide('cw.func');

/**
 * @param {*} obj Any object.
 * @return {boolean} Whether {@code obj} is probably callable.  This works
 * 	even on an object that IE has proxied because it came from another window.
 */
cw.func.isCallable = function(obj) {
	return goog.isFunction(obj) || (
		// IE proxies objects that come from other windows (but not
		// iframes).
		typeof obj == 'object' &&
		goog.isFunction(obj.call) &&
		goog.isFunction(obj.apply))
};

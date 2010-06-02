/**
 * @fileoverview Load this script onto dumb pages that use console.log(...)
 * 	and similar functions, without checking if console is even available.
 * 	Do not write code this needs this script.
 */

goog.provide('cw.firebugEmptyObjects');


cw.firebugEmptyObjects.injectDummies = function() {
	if (!goog.global['console'] || !goog.global['console']['firebug']) {
		var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml",
		"group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];

		var n = names.length;
		while(n--) {
			goog.global['console'][names[n]] = function() {};
		}
	}
};

cw.firebugEmptyObjects.injectDummies();

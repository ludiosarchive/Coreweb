goog.provide('cw.firebugEmptyObjects');

(function(){
	if (!window.console || !console.firebug) {
		var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml",
		"group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];

		var n = names.length;
		while(n--) {
			window.console[names[n]] = function() {};
		}
	}
})();

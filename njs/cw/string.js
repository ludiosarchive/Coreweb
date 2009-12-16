goog.require('goog.asserts');

goog.provide('cw.string');


/**
 * Like Python's s.split(delim, num) and s.split(delim)
 * This does *NOT* implement Python's no-argument s.split()
 */
cw.string.split = function(s, sep, maxsplit) {
	goog.asserts.assert(sep !== undefined, "arguments[1] of CW.split must be a separator string");
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

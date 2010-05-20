/**
 * @fileoverview Tests for cw.eq
 */

goog.provide('cw.Test.TestEq');

goog.require('cw.Class');
goog.require('cw.UnitTest');
goog.require('cw.eq');
goog.require('goog.array');


// anti-clobbering for JScript; aliases
(function(){

var equals = cw.eq.equals;


cw.UnitTest.TestCase.subclass(cw.Test.TestEq, 'EqTests').methods(
	function test_(self) {
		var object = {'prop1': ['array', 'items', 1, 1.5, null, true, false, {"1": "abc"}, {}, [1, 2], [1], []]};
		self.assertIdentical('{"prop1": ["array", "items", 1, 1.5, null, true, false, {"1": "abc"}, {}, [1, 2], [1], []]}', repr(object));
	}

	// TODO: IE6-IE8 [[DontEnum]] shadowing tests
);

})(); // end anti-clobbering for JScript

/**
 * @fileoverview Tests for cw.math
 */

goog.provide('cw.Test.TestMath');

goog.require('cw.UnitTest');
goog.require('cw.math');


// anti-clobbering for JScript
(function(){


cw.UnitTest.TestCase.subclass(cw.Test.TestMath, 'NumberTests').methods(

	function test_largerThanLargest(self) {
		self.assertTrue(cw.math.LARGER_THAN_LARGEST_INTEGER > cw.math.LARGEST_INTEGER);
	}
);

})(); // end anti-clobbering for JScript

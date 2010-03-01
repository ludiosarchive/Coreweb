/**
 * Tests for cw.eventual
 */

goog.require('cw.UnitTest');
goog.require('cw.eventual');

goog.provide('cw.Test.TestEventual');

// anti-clobbering for JScript
(function(){

cw.UnitTest.TestCase.subclass(cw.Test.TestEventual, 'TestSimpleCallQueue').methods(

	function test_append(self) {
		var clock = new cw.UnitTest.Clock();
		var q = new cw.eventual.SimpleCallQueue(clock);
		var calls = [];

		var A = function(){}
		var cb = function(arg1, arg2){
			calls.push([this, arg1, arg2]);
		}
		var a = new A();

		q.append_(cb, a, [10, "20"]);
		self.assertEqual([], calls);
		clock.advance(0);
		self.assertEqual([[a, 10, "20"]], calls);

		// And again
		q.append_(cb, a, ["30", 40]);
		self.assertEqual([[a, 10, "20"]], calls);
		clock.advance(0);
		self.assertEqual([[a, 10, "20"], [a, "30", 40]], calls);
	}
);


cw.UnitTest.TestCase.subclass(cw.Test.TestEventual, 'TestGlobalFunctions').methods(
	function test_x(self) {

	}
);

})();

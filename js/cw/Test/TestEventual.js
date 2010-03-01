/**
 * Tests for cw.eventual
 */

goog.require('cw.UnitTest');
goog.require('cw.eventual');

goog.provide('cw.Test.TestEventual');

// anti-clobbering for JScript
(function(){

cw.UnitTest.TestCase.subclass(cw.Test.TestEventual, 'TestSimpleCallQueue').methods(
	/**
	 * append_ works calls the callable with the correct
	 * context and args.
	 */
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
	},

	/**
	 * If a callable calls append_, the new call isn't called
	 * until after control returns to the environment.
	 */
	function test_appendReentrant(self) {

	},

	/**
	 * If a callable throws an error, the error is rethrown in 0ms.
	 */
	function test_callableThrows(self) {

	},

	/**
	 * flush_ returns a Deferred that fires when the call queue is
	 * completely empty.
	 */
	function test_flush(self) {

	}
);


cw.UnitTest.TestCase.subclass(cw.Test.TestEventual, 'TestGlobalFunctions').methods(
	function test_x(self) {

	}
);

})();

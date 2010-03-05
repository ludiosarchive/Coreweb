/**
 * Tests for cw.eventual
 */

goog.require('cw.UnitTest');
goog.require('cw.clock');
goog.require('cw.eventual');

goog.provide('cw.Test.TestEventual');

// anti-clobbering for JScript
(function(){

cw.UnitTest.TestCase.subclass(cw.Test.TestEventual, 'TestCallQueue').methods(
	/**
	 * eventually_ works calls the callable with the correct
	 * scope and args.
	 */
	function test_eventually(self) {
		var clock = new cw.clock.Clock();
		var cq = new cw.eventual.CallQueue(clock);
		var calls = [];

		var A = function() {}
		var cb = function(arg1, arg2) {
			calls.push([this, arg1, arg2]);
		}
		var a = new A();

		cq.eventually_(cb, a, [10, "20"]);
		self.assertEqual([], calls);
		clock.advance_(0);
		self.assertEqual([[a, 10, "20"]], calls);

		// And again
		cq.eventually_(cb, a, ["30", 40]);
		self.assertEqual([[a, 10, "20"]], calls);
		clock.advance_(0);
		self.assertEqual([[a, 10, "20"], [a, "30", 40]], calls);
	},

	/**
	 * If a callable calls eventually_, the new call isn't called
	 * until after control returns to the environment.
	 */
	function test_eventuallyReentrant(self) {
		var clock = new cw.clock.Clock();
		var cq = new cw.eventual.CallQueue(clock);
		var calls = [];

		var cb = function(arg) {
			calls.push(arg);
			if(arg === 1) {
				cq.eventually_(cb, null, [2]);
			}
		}

		cq.eventually_(cb, null, [1]);

		self.assertEqual([], calls);
		clock.advance_(0);
		self.assertEqual([1], calls);
		clock.advance_(0);
		self.assertEqual([1, 2], calls);
		clock.advance_(0);
		self.assertEqual([1, 2], calls);
	},

	/**
	 * If a callable throws an error, the error is rethrown in 0ms.
	 */
	function test_callableThrows(self) {

	},

	/**
	 * notifyEmpty_ returns a Deferred that fires when the call queue is
	 * completely empty.
	 */
	function test_notifyEmptyNotEmptyYet(self) {

	},

	/**
	 * notifyEmpty_ returns a Deferred that fires right away, if the call
	 * queue is completely empty.
	 */
	function test_notifyEmptyQueueEmpty(self) {

	},

	/**
	 * If a callback triggered by a notifyEmpty_ Deferred adds a callable
	 * to the CallQueue and calls notifyEmpty, the Deferred is fired after the
	 * CallQueue becomes empty again.
	 */
	function test_notifyEmptyReentrantNotEmptyYet(self) {

	},

	/**
	 * If a callback triggered by a notifyEmpty_ Deferred calls notifyEmpty_,
	 * the Deferred is fired right away.
	 */
	function test_notifyEmptyReentrantQueueEmpty(self) {

	},

	/**
	 * fireEventually_ returns a Deferred that fires eventually with the
	 * correct value.
	 */
	function test_fireEventually(self) {

	},

	/**
	 * CallQueue has a publicly-accessible clock_ property.
	 */
	function test_publicClock(self) {

	}
);


cw.UnitTest.TestCase.subclass(cw.Test.TestEventual, 'TestGlobalCallQueue').methods(
	function test_x(self) {

	}
);

})(); // end anti-clobbering for JScript

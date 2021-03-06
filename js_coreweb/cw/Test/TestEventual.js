/**
 * @fileoverview Tests for cw.eventual
 */

goog.provide('cw.Test.TestEventual');

goog.require('cw.UnitTest');
goog.require('cw.clock');
goog.require('cw.eventual');


// anti-clobbering for JScript
(function() {

cw.UnitTest.TestCase.subclass(cw.Test.TestEventual, 'TestCallQueue').methods(
	/**
	 * eventually works calls the callable with the correct
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

		cq.eventually(cb, a, [10, "20"]);
		self.assertEqual([], calls);
		clock.advance(0);
		self.assertEqual([[a, 10, "20"]], calls);

		// And again
		cq.eventually(cb, a, ["30", 40]);
		self.assertEqual([[a, 10, "20"]], calls);
		clock.advance(0);
		self.assertEqual([[a, 10, "20"], [a, "30", 40]], calls);
	},

	/**
	 * If a callable calls eventually, the new call isn't called
	 * until after control returns to the environment.
	 */
	function test_eventuallyReentrant(self) {
		var clock = new cw.clock.Clock();
		var cq = new cw.eventual.CallQueue(clock);
		var calls = [];

		var cb = function(arg) {
			calls.push(arg);
			if(arg === 1) {
				cq.eventually(cb, null, [2]);
			}
		}

		cq.eventually(cb, null, [1]);

		self.assertEqual([], calls);
		clock.advance(0);
		self.assertEqual([1], calls);
		clock.advance(0);
		self.assertEqual([1, 2], calls);
		clock.advance(0);
		self.assertEqual([1, 2], calls);
	},

	/**
	 * If a callable throws an error, the error is rethrown in 0ms.
	 */
	function test_callableThrows(self) {
		var clock = new cw.clock.Clock();
		var cq = new cw.eventual.CallQueue(clock);

		var throwingCallable = function() {
			throw new Error("hi");
		}

		cq.eventually(throwingCallable, null, []);
		clock.advance(0);

		var gotError = false;
		try {
			clock.advance(0);
		} catch(e) {
			gotError = true;
			self.assertErrorMessage(e, "hi");
		}

		self.assertEqual(true, gotError);

		// no more errors
		clock.advance(0);
		clock.advance(0);
	},

	/**
	 * notifyEmpty returns a Deferred that fires when the call queue is
	 * completely empty.
	 */
	function test_notifyEmptyNotEmptyYet(self) {
		var clock = new cw.clock.Clock();
		var cq = new cw.eventual.CallQueue(clock);
		var notified = false;

		cq.eventually(function() {}, this, []);
		cq.eventually(function() {}, this, []);
		cq.eventually(function() {}, this, []);

		var d = cq.notifyEmpty();
		d.addCallback(function() { notified = true; });

		self.assertEqual(false, notified);
		clock.advance(0);
		self.assertEqual(true, notified);
	},

	/**
	 * notifyEmpty returns a Deferred that fires right away, if the call
	 * queue is completely empty.
	 */
	function test_notifyEmptyQueueEmpty(self) {
		var clock = new cw.clock.Clock();
		var cq = new cw.eventual.CallQueue(clock);
		var notified = false;

		var d = cq.notifyEmpty();
		d.addCallback(function() { notified = true; });

		self.assertEqual(true, notified);
	},

	/**
	 * If a callback triggered by a notifyEmpty Deferred adds a callable
	 * to the CallQueue and calls notifyEmpty, the Deferred is fired after the
	 * CallQueue becomes empty again.
	 */
	function test_notifyEmptyReentrantNotEmptyYet(self) {
		var clock = new cw.clock.Clock();
		var cq = new cw.eventual.CallQueue(clock);
		var notified = false;
		var notified2 = false;

		cq.eventually(function() {}, this, []);

		var d = cq.notifyEmpty();
		d.addCallback(function() {
			notified = true;
			cq.eventually(function() {}, this, []);
			cq.notifyEmpty().addCallback(function() { notified2 = true; });
		});

		self.assertEqual(false, notified);
		self.assertEqual(false, notified2);
		clock.advance(0);
		self.assertEqual(true, notified);
		self.assertEqual(false, notified2);
		clock.advance(0);
		self.assertEqual(true, notified);
		self.assertEqual(true, notified2);
	},

	/**
	 * If a callback triggered by a notifyEmpty Deferred calls notifyEmpty,
	 * the Deferred is fired right away.
	 */
	function test_notifyEmptyReentrantQueueEmpty(self) {
		var clock = new cw.clock.Clock();
		var cq = new cw.eventual.CallQueue(clock);
		var notified = false;
		var notified2 = false;

		cq.eventually(function() {}, this, []);

		var d = cq.notifyEmpty();
		d.addCallback(function() {
			notified = true;
			cq.notifyEmpty().addCallback(function() { notified2 = true; });
		});

		self.assertEqual(false, notified);
		self.assertEqual(false, notified2);
		clock.advance(0);
		self.assertEqual(true, notified);
		self.assertEqual(true, notified2);
	},

	/**
	 * fireEventually returns a Deferred that fires eventually with the
	 * correct value.
	 */
	function test_fireEventually(self) {
		var clock = new cw.clock.Clock();
		var cq = new cw.eventual.CallQueue(clock);
		var d = cq.fireEventually("hi");
		var called = false;
		d.addCallback(function(value) { called = [arguments.length, value]; });

		self.assertEqual(false, called);
		clock.advance(0);
		self.assertEqual([1, "hi"], called);
	},

	/**
	 * CallQueue has a publicly-accessible {@code clock} property.
	 */
	function test_publicClock(self) {
		var clock = new cw.clock.Clock();
		var cq = new cw.eventual.CallQueue(clock);
		self.assertIdentical(clock, cq.clock);
	}
);


cw.UnitTest.TestCase.subclass(cw.Test.TestEventual, 'TestGlobalCallQueue').methods(
	/**
	 * cw.eventual.theCallQueue exists and seems to work.
	 */
	function test_theQueue(self) {
		self.assertTrue(cw.eventual.theCallQueue instanceof cw.eventual.CallQueue);
		self.assertIdentical(goog.global['window'], cw.eventual.theCallQueue.clock);

		var d = cw.eventual.theCallQueue.fireEventually(null);
		return d;
	}
);

})(); // end anti-clobbering for JScript

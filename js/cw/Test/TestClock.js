/**
 * @fileoverview Tests for cw.clock
 */

goog.provide('cw.Test.TestClock');

goog.require('cw.UnitTest');
goog.require('cw.array');
goog.require('cw.clock');


// anti-clobbering for JScript
(function(){

/**
 * @return {boolean} Whether the {@code ticket} is in {@code calls}.
 */
cw.Test.TestClock.isTicketInCalls_ = function(calls, ticket) {
	var haveIt = false;
	var n = calls.length;
	while(n--) {
		var call = calls[n];
		if(call.ticket_ === ticket) {
			haveIt = true;
		}
	}
	return haveIt;
}


/**
 * Tests for {@code cw.clock.Clock}
 */
cw.UnitTest.TestCase.subclass(cw.Test.TestClock, 'ClockTests').methods(
	/**
	 * setTimeout and setInterval return tickets from the same pool
	 * of numbers. None of the ticket numbers are the same.
	 */
	function test_setWhateverUseGlobalCounter(self) {
		var clock = new cw.clock.Clock();
		var tickets = [
			clock.setTimeout(function(){}, 0),
			clock.setTimeout(function(){}, 0),
			clock.setInterval(function(){}, 1),
			clock.setInterval(function(){}, 1)
		];

		self.assertEqual(4, cw.array.uniq(tickets).length);
	},

	/**
	 * clearTimeout
	 */
	function test_clearTimeout(self) {
		var clock = new cw.clock.Clock();
		var ticket1 = clock.setTimeout(function(){}, 0);
		var ticket2 = clock.setTimeout(function(){}, 0);
		var ticket3 = clock.setTimeout(function(){}, 0);
		self.assertEqual(3, clock.getCallsArray_().length);

		// "clear" some bogus ticket ID, make sure nothing changed.
		clock.clearTimeout(-1237897661782631241233143);
		self.assertEqual(3, clock.getCallsArray_().length);

		// clear the real ticket
		clock.clearTimeout(ticket2);
		self.assertEqual(2, clock.getCallsArray_().length);

		// make sure the other tickets are still there
		self.assert(cw.Test.TestClock.isTicketInCalls_(clock.getCallsArray_(), ticket1));
		self.assert(cw.Test.TestClock.isTicketInCalls_(clock.getCallsArray_(), ticket3));

		// Check for clearInterval can clear a timeout.
		clock.clearInterval(ticket1);
		clock.clearInterval(ticket3);
		self.assertEqual(0, clock.getCallsArray_().length);
	},


	function test_clearBogusIntervals(self) {
		var clock = new cw.clock.Clock();
		self.assertEqual(undefined, clock.clearTimeout(-1237897661782631241233143));
		self.assertEqual(undefined, clock.clearInterval(1237897661782631241233143));
	},


	function test_clearTimeoutCanClearInterval(self) {
		var clock = new cw.clock.Clock();
		var ticket1 = clock.setInterval(function(){}, 1);
		self.assertEqual(1, clock.getCallsArray_().length);
		clock.clearTimeout(ticket1);
		self.assertEqual(0, clock.getCallsArray_().length);
	},


	function test_advanceTwoTimeoutsSeperately(self) {
		var clock = new cw.clock.Clock();
		var called1 = false;
		var called2 = false;
		clock.setTimeout(function(){called1 = true}, 3);
		clock.setTimeout(function(){called2 = true}, 4);

		clock.advance_(1);
		clock.advance_(1);
		self.assertEqual(false, called1);
		clock.advance_(1);
		self.assertEqual(true, called1);
		self.assertEqual(false, called2);

		clock.advance_(1);
		self.assertEqual(true, called2);
	},


	function test_advanceTwoTimeoutsAtSameTime(self) {
		var clock = new cw.clock.Clock();
		var called1 = false;
		var called2 = false;
		clock.setTimeout(function(){called1 = true}, 2);
		clock.setTimeout(function(){called2 = true}, 2);
		self.assertEqual(false, called1);
		self.assertEqual(false, called2);

		// the far future
		clock.advance_(10000);
		self.assertEqual(true, called1);
		self.assertEqual(true, called2);
	},


	function test_advanceSlowlyInterval(self) {
		var clock = new cw.clock.Clock();
		var called1 = 0;
		var called2 = 0;
		clock.setInterval(function(){called1 += 1}, 2);
		clock.setInterval(function(){called2 += 1}, 3);

		clock.advance_(2);
		self.assertEqual(1, called1);
		self.assertEqual(0, called2);

		clock.advance_(1);
		self.assertEqual(1, called1);
		self.assertEqual(1, called2);

		clock.advance_(3);
		self.assertEqual(3, called1);
		self.assertEqual(2, called2);
	},


	function test_advanceQuicklyInterval(self) {
		var clock = new cw.clock.Clock();
		var called1 = 0;
		var called2 = 0;
		clock.setInterval(function(){called1 += 1}, 2);
		clock.setInterval(function(){called2 += 1}, 3);

		clock.advance_(6);
		self.assertEqual(3, called1);
		self.assertEqual(2, called2);
	},

	/**
	 * The clock can still be advanced after a callable throws an error.
	 */
	function test_canAdvanceAfterError(self) {
		var clock = new cw.clock.Clock();
		var counter = 0;
		var errors = 0;
		var badCallable = function() {
			throw new Error("hi");
		}
		var goodCallable = function() {
			counter += 1;
		}

		clock.setTimeout(badCallable, 0);
		clock.setTimeout(goodCallable, 1);

		try {
			clock.advance_(0);
		} catch(e) {
			errors += 1;
		}

		clock.advance_(1);

		self.assertEqual(1, counter);
		self.assertEqual(1, errors);
	},

	/**
	 * If a callback adds another timeout that should run in 0ms,
	 * the new timeout isn't called until the next clock advance_.
	 */
	function test_newCallsInsideCallableHappenAtNextAdvance(self) {
		var clock = new cw.clock.Clock();
		var out = [];
		var counter = 0;
		clock.setTimeout(function() {
			counter++;
			out.push(counter);
			clock.setTimeout(function() {
				counter++;
				out.push(counter);
			}, 0);
		}, 0);

		self.assertEqual([], out);
		clock.advance_(0);
		self.assertEqual([1], out);
		clock.advance_(0);
		self.assertEqual([1, 2], out);
		clock.advance_(0);
		self.assertEqual([1, 2], out);
	},

	/**
	 * A callback can successfully cancel a timeout that is scheduled
	 * to run right after it in the same clock "turn".
	 */
	function test_clearTimeoutSiblingCall(self) {
		var clock = new cw.clock.Clock();
		var out = [];

		var nextTicket;
		clock.setTimeout(function() {out.push("ok"); clock.clearTimeout(nextTicket)}, 0);
		nextTicket = clock.setTimeout(function() {out.push("should never get called")}, 0);

		// Make sure the first-added timeout is first
		clock.getCallsArray_().sort(function(a, b) { return a.ticket_ < b.ticket_ ? -1 : 1; });

		self.assertEqual([], out);
		clock.advance_(0);
		clock.advance_(0);
		clock.advance_(0);
		self.assertEqual(["ok"], out);
	},

	/**
	 * Test that intervals can be cleared from inside a callable.
	 */
	function test_clearIntervalInsideCallable(self) {
		var clock = new cw.clock.Clock();
		var called1 = 0;
		var called2 = 0;
		var ticket1 = clock.setInterval(function(){called1 += 1}, 2);
		clock.setInterval(function(){called2 += 1; clock.clearTimeout(ticket1)}, 3);

		clock.advance_(2);
		self.assertEqual(1, called1);
		self.assertEqual(0, called2);

		clock.advance_(1);
		self.assertEqual(1, called1);
		self.assertEqual(1, called2);
		// ticket1 should be cleared at this point.

		clock.advance_(6);
		self.assertEqual(1, called1);
		self.assertEqual(3, called2);
	},


	/**
	 * Similar to test_clearIntervalInsideCallable, except we only advance_ the clock
	 * once.
	 */
	function test_clearIntervalAppliesImmediately(self) {
		var clock = new cw.clock.Clock();
		var called1 = 0;
		var called2 = 0;
		var ticket1 = clock.setInterval(function(){called1 += 1}, 2);
		clock.setInterval(function(){called2 += 1; clock.clearTimeout(ticket1)}, 3);

		clock.advance_(9);
		self.assertEqual(1, called1);
		self.assertEqual(3, called2);
	},

	/**
	 * In a real browser environment, callables have no way of re-entrantly
	 * pushing the event loop. In Twisted, it is similarly illega to re-entrantly
	 * advance_ the reactor.
	 *
	 * Similarly, with {@code cw.clock.Clock}, it is also illegal.
	 */
	function test_reentrantAdvanceThrowsError(self) {
		var clock = new cw.clock.Clock();
		var counter = 0;
		var err;
		clock.setTimeout(function() {
			counter += 1;
			try {
				clock.advance_(1);
			} catch(e) {
				err = e;
			}
		}, 2);
		clock.advance_(2);
		self.assertEqual(1, counter);
		self.assert(err instanceof cw.clock.ClockAdvanceError, err);
	},


	function test_callablesCalledWithWindowThis(self) {
		var called = 0;
		function callable() {
			// Don't use assertIdentical; if that fails here, you'll see a stack overflow.
			self.assert(this === window, "this !== window");
			called = 1;
		}
		var clock = new cw.clock.Clock();
		clock.setTimeout(callable, 1);
		clock.advance_(1);
		self.assert(called === 1, "callable wasn't even called?");
	},


	function test_clockAdvanceError(self) {
		var clock = new cw.clock.Clock();
		self.assertThrows(cw.clock.ClockAdvanceError, function(){clock.advance_(-1);});
		self.assertThrows(cw.clock.ClockAdvanceError, function(){clock.advance_(-0.5);});
	},


	function test_dateObject(self) {
		var clock = new cw.clock.Clock();
		var date = new clock.Date();
		self.assertEqual(0, date.getTime());
		clock.advance_(1001);
		self.assertEqual(1001, date.getTime());
	}

);

})(); // end anti-clobbering for JScript

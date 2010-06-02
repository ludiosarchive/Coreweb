/**
 * @fileoverview Tests for cw.clock
 */

goog.provide('cw.Test.TestClock');

goog.require('cw.UnitTest');
goog.require('cw.array');
goog.require('cw.clock');
goog.require('goog.object');


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
};


/**
 * Tests for {@link cw.clock.Clock}
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
		self.assertTrue(cw.Test.TestClock.isTicketInCalls_(clock.getCallsArray_(), ticket1));
		self.assertTrue(cw.Test.TestClock.isTicketInCalls_(clock.getCallsArray_(), ticket3));

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
		self.assertEqual(2, called1);
		self.assertEqual(2, called2);
	},

	/**
	 * a setInterval happens a maximum of 1 time per advance.
	 */
	function test_maxOneSetIntervalPerAdvance(self) {
		var clock = new cw.clock.Clock();
		var counter = 0;
		clock.setInterval(function() { counter += 1; }, 2);
		clock.advance_(20);
		self.assertEqual(1, counter);
		clock.advance_(6);
		self.assertEqual(2, counter);
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
		clock.setTimeout(function() { out.push("ok"); clock.clearTimeout(nextTicket); }, 0);
		nextTicket = clock.setTimeout(function() { out.push("should never get called"); }, 0);

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
		var ticket1 = clock.setInterval(function() { called1 += 1; }, 2);
		clock.setInterval(function() { called2 += 1; clock.clearTimeout(ticket1); }, 3);

		clock.advance_(2);
		self.assertEqual(1, called1);
		self.assertEqual(0, called2);

		clock.advance_(1);
		self.assertEqual(1, called1);
		self.assertEqual(1, called2);
		// ticket1 should be cleared at this point.

		clock.advance_(6);
		self.assertEqual(1, called1);
		self.assertEqual(2, called2);
	},

	/**
	 * In a real browser environment, callables have no way of re-entrantly
	 * pushing the event loop. In Twisted, it is similarly illega to re-entrantly
	 * advance_ the reactor.
	 *
	 * Similarly, with {@link cw.clock.Clock}, it is also illegal.
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
		self.assertTrue(err instanceof cw.clock.ClockAdvanceError, err);
	},

	/**
	 * Callables are called with in the context of the window, not some
	 * other object like a {@link cw.clock.Clock}.
	 */
	function test_callablesCalledWithWindowThis(self) {
		var scopeObject = 12345; // placeholder
		function callable() {
			scopeObject = this;
		}
		var clock = new cw.clock.Clock();
		clock.setTimeout(callable, 1);
		clock.advance_(1);
		// Don't use assertIdentical or similar because TestCase.compare
		// calls cw.repr.repr, and this leads to a stack overflow if
		// the objects do not match.
		self.assertTrue(window === scopeObject,
			"this !== scopeObject; scopeObject is " + scopeObject.toString() +
			" with keys " + goog.object.getKeys(scopeObject).join(','));
	},


	function test_clockAdvanceError(self) {
		var clock = new cw.clock.Clock();
		self.assertThrows(cw.clock.ClockAdvanceError, function(){ clock.advance_(-1); });
		self.assertThrows(cw.clock.ClockAdvanceError, function(){ clock.advance_(-0.5); });
	},

	/**
	 * clock.getTime exists and returns the clock's time
	 */
	function test_getTime(self) {
		var clock = new cw.clock.Clock();
		self.assertEqual(0, clock.getTime());
		clock.advance_(1001);
		self.assertEqual(1001, clock.getTime());
	},

	/**
	 * clock.Date is a constructor that returns a pseudo-Date object,
	 * on which {@code getTime} can be called and returns the clock's time.
	 */
	function test_dateObject(self) {
		var clock = new cw.clock.Clock();
		var date = new clock.Date();
		self.assertEqual(0, date.getTime());
		clock.advance_(1001);
		self.assertEqual(1001, date.getTime());
	},

	/**
	 * clock.setTime_ can be used the change the Clock's time.
	 */
	function test_setTime(self) {
		var clock = new cw.clock.Clock();
		var called = false;
		clock.setTimeout(function() { called = true; }, 2000);
		clock.advance_(1001);
		self.assertEqual(1001, clock.getTime());
		clock.setTime_(50);
		self.assertEqual(50, clock.getTime());
		clock.setTime_(3000);
		self.assertEqual(3000, clock.getTime());

		// setTime_ is not like advance; it will not call scheduled calls.
		self.assertEqual(false, called);
	},

	/**
	 * clock.fireEverything_ fires everything, even if it's too early.
	 */
	function test_fireEverything(self) {
		var clock = new cw.clock.Clock();
		var called = [0, 0, 0, 0];
		clock.setTimeout(function() { called[0] += 1; }, 1000);
		clock.setTimeout(function() { called[1] += 1; }, 2000);
		clock.setTimeout(function() { called[2] += 1; }, 3000);
		clock.setInterval(function() { called[3] += 1; }, 2000);
		clock.setTime_(1500); // but don't advance
		clock.fireEverything_();
		self.assertEqual([1, 1, 1, 1], called);
		clock.advance_(4000); // Make sure advance_ also works
		self.assertEqual([1, 1, 1, 2], called);
		clock.fireEverything_();
		self.assertEqual([1, 1, 1, 3], called); // the interval is called yet again
	}
);


/**
 * Tests for {@link cw.clock.JumpDetector}
 */
cw.UnitTest.TestCase.subclass(cw.Test.TestClock, 'JumpDetectorTests').methods(
	/**
	 * monoTime_ starts at 0 and increases as the clock is advanced.
	 * It does not attempt to compensate for the page being frozen
	 * for a while.
	 */
	function test_monoTime(self) {
		var clock = new cw.clock.Clock();
		var jd = new cw.clock.JumpDetector(clock, 3000, 5);
		self.assertEqual(null, jd.monoTime_);
		jd.start_();
		self.assertEqual(0, jd.monoTime_);
		clock.advance_(2999);
		self.assertEqual(0, jd.monoTime_);
		clock.advance_(1);
		self.assertEqual(3000, jd.monoTime_);
		clock.advance_(4000);
		self.assertEqual(6000, jd.monoTime_);
		clock.advance_(30000);
		self.assertEqual(9000, jd.monoTime_);
	},

	/**
	 * getNewTimes returns everything in timeCollection_ and flushes
	 * timeCollection_.
	 */
	function test_getNewTimes(self) {
		var clock = new cw.clock.Clock();
		var jd = new cw.clock.JumpDetector(clock, 3000, 5);
		self.assertEqual([], jd.getNewTimes_());
		jd.start_();
		self.assertEqual([0], jd.getNewTimes_());
		clock.advance_(2900);
		self.assertEqual([], jd.getNewTimes_());
		clock.advance_(100);
		clock.advance_(4000);
		self.assertEqual([3000, 7000], jd.getNewTimes_());
		self.assertEqual([], jd.getNewTimes_());
	},

	/**
	 * TIME_COLLECTION_OVERFLOW is dispatched when timeCollection_
	 * overflows. The event includes the property `collection` with all
	 * times collected (except the last one).
	 */
	function test_timeCollectionOverflow(self) {
		var clock = new cw.clock.Clock();
		var jd = new cw.clock.JumpDetector(clock, 3000, 5);
		var called = false;
		function callback(ev) {
			called = ev;
		}
		jd.addEventListener(
			cw.clock.EventType.TIME_COLLECTION_OVERFLOW, callback, true);
		jd.start_();
		clock.advance_(3000);
		clock.advance_(3000);
		clock.advance_(3000);
		clock.advance_(3500);
		// At this point, timeCollection_ has 5 entries, but hasn't overflowed yet.
		self.assertEqual(false, called);
		clock.advance_(10000);
		self.assertEqual([0, 3000, 6000, 9000, 12500], called.collection);
	},

	/**
	 * If an event callback for TIME_COLLECTION_OVERFLOW calls
	 * getNewTimes_, it gets an empty array.
	 */
	function test_timeCollectionOverflowReentrantGetNewTimes(self) {
		var clock = new cw.clock.Clock();
		var jd = new cw.clock.JumpDetector(clock, 3000, 2);
		var results;
		function callback(ev) {
			results = jd.getNewTimes_();
		}
		jd.addEventListener(
			cw.clock.EventType.TIME_COLLECTION_OVERFLOW, callback, true);
		jd.start_();

		clock.advance_(3000);
		self.assertEqual(undefined, results);
		clock.advance_(3000);
		self.assertEqual([], results);
	},

	/**
	 * timeCollection has {@code null}s preceding timestamps that were
	 * taken before a prod_ reset the internal timer.
	 */
	function test_timeCollectionNullMarkers(self) {
		1/0
	},

	/**
	 * If the clock jumped backwards, and this is detected by prodding,
	 * a TIME_JUMP event is dispatched with properties {@code timeLast_}
	 * and {@code timeNow_} and {@code expectedFiringTime_}.
	 */
	function test_backwardsClockJumpAndProd(self) {
		var clock = new cw.clock.Clock();
		var jd = new cw.clock.JumpDetector(clock, 3000, 2);
		var event = null;
		function callback(ev) {
			event = ev;
		}
		jd.addEventListener(
			cw.clock.EventType.TIME_JUMP, callback, true);
		jd.start_();

		clock.advance_(3000);
		clock.advance_(2000);
		self.assertEqual(null, event);

		// Jump the clock by 1 millisecond from the last recorded time
		clock.setTime_(2999);
		jd.prod_();
		self.assertEqual(3000, event.timeLast_);
		self.assertEqual(2999, event.timeNow_);
		self.assertEqual(6000, event.expectedFiringTime_);

		// Jump the clock back again
		clock.setTime_(0);
		jd.prod_();
		self.assertEqual(2999, event.timeLast_);
		self.assertEqual(0, event.timeNow_);
		self.assertEqual(5999, event.expectedFiringTime_);

		// Test the private state, ick
		self.assertEqual(3000, jd.expectedFiringTime_);
	},

	/**
	 * If the clock jumped backwards, and this is detected by the internal timer,
	 * a TIME_JUMP event is dispatched with properties {@code timeLast_}
	 * and {@code timeNow_} and {@code expectedFiringTime_}.
	 */
	function test_backwardsClockJumpAndTimer(self) {
		var clock = new cw.clock.Clock();
		var jd = new cw.clock.JumpDetector(clock, 3000, 2);
		var event = null;
		function callback(ev) {
			event = ev;
		}
		jd.addEventListener(
			cw.clock.EventType.TIME_JUMP, callback, true);
		jd.start_();

		clock.advance_(3000);
		clock.setTime_(0);
		clock.fireEverything_();

		self.assertEqual(3000, event.timeLast_);
		self.assertEqual(0, event.timeNow_);
		self.assertEqual(6000, event.expectedFiringTime_);

		// Test the private state, ick
		self.assertEqual(3000, jd.expectedFiringTime_);
	},

	/**
	 * If the clock jumped forwards (and this is detected by the timer), a
	 * TIME_JUMP event is dispatched with properties {@code timeLast_} and
	 * {@code timeNow_} and {@code expectedFiringTime_}.
	 */
	function test_forwardsClockJumpByTimer(self) {
		var clock = new cw.clock.Clock();
		var jd = new cw.clock.JumpDetector(clock, 3000, 2);
		var forg = cw.clock.TIMER_FORGIVENESS;
		var event = null;
		function callback(ev) {
			event = ev;
		}
		jd.addEventListener(
			cw.clock.EventType.TIME_JUMP, callback, true);
		jd.start_();

		clock.advance_(3000);
		self.assertEqual(null, event);

		clock.advance_(3000 + forg);
		self.assertEqual(null, event);

		clock.advance_(3000 + forg + 1);
		self.assertEqual((2*3000 + forg), event.timeLast_);
		self.assertEqual((3*3000 + 2*forg + 1), event.timeNow_);
		self.assertEqual((3*3000 + forg), event.expectedFiringTime_);

		// Test the private state, ick
		self.assertEqual(4*3000 + 2*forg + 1, jd.expectedFiringTime_);
	},

	/**
	 * If the internal timer has not fired by its due date (for whatever reason), a
	 * TIME_JUMP event is dispatched.
	 *
	 * In the real world, this happens on Chromium/Windows if the
	 * clock jumps backwards and then the user clicks around a bit later (causing prodding).
	 * See http://ludios.net/browser_bugs/clock_jump_test_page.html
	 *
	 * But much more often, it happens if timers are scheduled with a monotonic
	 * clock, and JumpDetector is prodded.
	 */
	function test_timerNotFiredByDueDate(self) {
		var clock = new cw.clock.Clock();
		var jd = new cw.clock.JumpDetector(clock, 3000, 2);
		var event = null;
		function callback(ev) {
			event = ev;
		}
		jd.addEventListener(
			cw.clock.EventType.TIME_JUMP, callback, true);
		jd.start_();

		clock.advance_(3000);
		self.assertEqual(null, event);

		var newTime = 3000 + 3000 + cw.clock.TIMER_FORGIVENESS + 1;
		clock.setTime_(newTime);
		jd.prod_();
		self.assertEqual(3000, event.timeLast_);
		self.assertEqual(newTime, event.timeNow_);
		self.assertEqual(2*3000, event.expectedFiringTime_);
	},

	/**
	 * Regression test for bug: TIME_JUMP was being (incorrectly) fired when
	 * timeLast was null, because of a lack of parentheses near && (now fixed).
	 */
	function test_noPhantomEventOnStart(self) {
		var clock = new cw.clock.Clock();
		var jd = new cw.clock.JumpDetector(clock, 3000, 2);
		var event = null;
		function callback(ev) {
			event = ev;
		}
		jd.addEventListener(
			cw.clock.EventType.TIME_JUMP, callback, true);
		clock.advance_(9000);
		jd.start_();

		self.assertEqual(null, event);
	},

	/**
	 * JumpDetector has a publicly-accessible {@code clock_} property.
	 */
	function test_publicClock(self) {
		var clock = new cw.clock.Clock();
		var jd = new cw.clock.JumpDetector(clock, 3000, 2);
		self.assertIdentical(clock, jd.clock_);
	},

	/**
	 * Dispose works on an unstarted JumpDetector
	 */
	function test_disposeUnstarted(self) {
		var clock = new cw.clock.Clock();
		var jd = new cw.clock.JumpDetector(clock, 3000, 2);
		jd.dispose();
		jd.dispose();
	},

	/**
	 * Dispose works on a started JumpDetector
	 */
	function test_disposeStarted(self) {
		var clock = new cw.clock.Clock();
		var jd = new cw.clock.JumpDetector(clock, 3000, 2);
		jd.start_();
		jd.dispose();
		jd.dispose();
	}
);

})(); // end anti-clobbering for JScript

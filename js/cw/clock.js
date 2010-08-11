/**
 * @fileoverview Deterministic clock; jump-detecting clock
 *
 * This file uses goog.Timer.getTime from our Closure Library branch `prime`.
 */

goog.provide('cw.clock');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.debug.Error');
goog.require('goog.Timer');
goog.require('goog.functions');


/**
 * Raised to indicate that that the cw.clock.Clock cannot be
 * advanced this way.
 *
 * @param {string} msg Reason why the clock could not be advanced.
 * @constructor
 * @extends {goog.debug.Error}
 */
cw.clock.ClockAdvanceError = function(msg) {
	goog.debug.Error.call(this, msg);
};
goog.inherits(cw.clock.ClockAdvanceError, goog.debug.Error);
cw.clock.ClockAdvanceError.prototype.name = 'cw.clock.ClockAdvanceError';


/**
 * Provide a deterministic, easily-controlled browser {@code window}.
 * This is useful for writing deterministic unit tests for code which
 * schedules events with `setTimeout`, `setInterval`, `clearTimeout`,
 * and `clearInterval`.
 *
 * Note that this does not mimic browser deficiencies in `setTimeout` and
 * `setInterval`. For example, the timeout in {@code setTimeout(callable, 1)}
 * will not be raised from 1ms to 13ms.
 *
 * This is inspired by {@code twisted.internet.task.Clock} but the
 * {@code advance} method behaves differently; see its JSDoc.
 * 
 * @constructor
 */
cw.clock.Clock = function() {
	/**
	 * @type {number}
	 */
	this.rightNow = 0;

	/**
	 * @type {number}
	 * @private
	 */
	this.ticketCounter_ = -1;

	/**
	 * @type {boolean}
	 * @private
	 */
	this.advancing_ = false;

	/**
	 * @type {!Array.<{
	 * 		ticket_: number,
	 * 		runAt_: number,
	 * 		notNow_: boolean,
	 * 		callable_: !Function,
	 * 		respawn_: boolean,
	 * 		interval_: ?number
	 * 	}>}
	 * @private
	 */
	this.calls_ = [];

	/**
	 * A deterministic Date object that works sort of like a standard
	 * {@code window.Date}.
	 *
	 * @constructor
	 */
	this.Date = function() {}

	var that = this;

	/**
	 * The deterministic version of {@code Date.getTime}.
	 * 
	 * @return {number} "Milliseconds since epoch", but really just
	 * 	the {@code Clock}'s time.
	 */
	this.Date.prototype.getTime = function() {
		return that.getTime();
	}

	// TODO: more Date functions, in case anything needs them.
	// The general strategy to implement `someMethod' would be:
	//    return new Date(thisClock.rightNow).someMethod();
};

/**
 * The deterministic version of {@code Date.getTime}.
 *
 * @return {number} "Milliseconds since epoch", but really just
 * 	the {@code Clock}'s time.
 *
 * Our modified version of goog.Timer expects this to be implemented.
 */
cw.clock.Clock.prototype.getTime = function() {
	return this.rightNow;
};

/**
 * @private
 */
cw.clock.Clock.prototype.addCall_ = function(call) {
	this.calls_.push(call);
	this.sortCalls_();
};

/**
 * @private
 */
cw.clock.Clock.prototype.sortCalls_ = function() {
	// We could sort by (x.notNow_, x.runAt_, x.ticket_) but that would be less
	// like browsers, where there is no guarantee of order.
	this.calls_.sort(function(a, b) {
		// "nowNow" calls are shoved to the end of the array
		var aPriority = a.runAt_ + (a.notNow_ ? 4294967296 : 0);
		var bPriority = b.runAt_ + (b.notNow_ ? 4294967296 : 0);
		if(aPriority == bPriority) {
			// Note: Stable sort is not guaranteed, and Chrome/V8
			// will not stable sort; see:
			// http://code.google.com/p/v8/issues/detail?id=90
			return 0;
		} else {
			return aPriority < bPriority ? -1 : 1;
		}
	});
};

/**
 * The deterministic version of {@code window.setTimeout}.
 *
 * @param {!Function} callable The callable to call soon.
 * @param {number} when When to call {@code callable}, in milliseconds.
 *
 * @return {number} The ticket number for the added event.
 */
cw.clock.Clock.prototype.setTimeout = function(callable, when) {
	this.addCall_({
		ticket_: ++this.ticketCounter_,
		runAt_: this.rightNow + when,
		notNow_: this.advancing_,
		callable_: callable,
		respawn_: false,
		interval_: null
	});
	return this.ticketCounter_;
};

/**
 * The deterministic version of {@code window.setInterval}.
 *
 * @param {!Function} callable The callable to call soon (possibly repeatedly).
 * @param {number} interval The delay between calls to {@code callable},
 * 	in milliseconds. If you want to, you may specify 0.
 *
 * @return {number} The ticket number for the added event.
 */
cw.clock.Clock.prototype.setInterval = function(callable, interval) {
	this.addCall_({
		ticket_: ++this.ticketCounter_,
		runAt_: this.rightNow + interval,
		nowNow_: this.advancing_,
		callable_: callable,
		respawn_: true,
		interval_: interval
	});
	return this.ticketCounter_;
};

/**
 * For use by unit tests ONLY.
 * @private
 */
cw.clock.Clock.prototype.getCallsArray_ = function() {
	return this.calls_;
};

/**
 * Remove a timeout or interval from calls_, by ticket number.
 *
 * Notes: in both Firefox 3.5.3 and IE8, you can successfully clearTimeout() an interval,
 * and clearInterval() a timeout, so here we don't check the timeout/interval type.
 *
 * @private
 */
cw.clock.Clock.prototype.clearAnything_ = function(ticket) {
	var n = this.calls_.length;
	while(n--) {
		var call = this.calls_[n];
		if(call.ticket_ === ticket) {
			var ret = this.calls_.splice(n, 1);
			goog.asserts.assert(ret[0].ticket_ === ticket, ret[0].ticket_ + " !== " + ticket);
			break;
		}
	}
};

/**
 * The deterministic version of {@code window.clearTimeout}.
 *
 * @param {number} ticket The ticket number of the timeout/interval to clear.
 */
cw.clock.Clock.prototype.clearTimeout = function(ticket) {
	this.clearAnything_(ticket);
};

/**
 * The deterministic version of {@code window.clearInterval}.
 *
 * @param {number} ticket The ticket number of the timeout/interval to clear.
 */
cw.clock.Clock.prototype.clearInterval = function(ticket) {
	this.clearAnything_(ticket);
};

/**
 * @param {function():boolean} extraStopCondition
 * @private
 */
cw.clock.Clock.prototype.internalAdvance_ = function(extraStopCondition) {
	if(this.advancing_) {
		throw new cw.clock.ClockAdvanceError("You cannot re-entrantly advance the Clock.");
	}

	this.advancing_ = true;

	try {
		// Remember that callables can add or clear timeouts/intervals.
		// New callables won't get called until at least the next `advance`,
		// but cleared timeouts/intervals will be immediately removed, even
		// while we're inside this loop. Note that callables should not expect
		// to reliably remove their "sibling" calls, because they run in an
		// arbitrary order. ("sibling" means happening around the same time).
		while(true) {
			//console.log('calls_: ', cw.repr.repr(this.calls_), 'rightNow: ', this.rightNow);
			if(this.calls_.length === 0 || extraStopCondition() || this.calls_[0].notNow_) {
				break;
			}
			var call = this.calls_.shift();

			// If it needs to be respawned, do it now, before calling the callable,
			// because the callable may raise an exception. Also because the
			// callable may want to clear its own interval.
			if(call.respawn_ === true) {
				call.runAt_ += call.interval_;
				call.notNow_ = true;
				this.addCall_(call);
			}

			// Make sure `this' is the global object for callable (making `this'
			// "worthless" like it is when the real setTimeout calls you.) Note that
			// for callable, `this' becomes `window', not `null'.
			call.callable_.call(null);
			// The equivalent `.apply` call failed in some cases in Opera 10.50-10.60
			// snapshot, at least before we changed how cw.clock.Clock works.
			//call.callable_.apply(null, []);
			// Opera 10.50 has a serious miscompilation issue and strips the
			// `apply` property on the callable after re-entrant calls happen.
			// See http://ludios.net/opera_bugs/opera_10_50_reentrant_array.html
			// The bug was reported to Opera as DSK-285105. `call.callable.call(null);`
			// still works, so we use that.
		}
	} finally {
		this.advancing_ = false;

		for(var i=0; i < this.calls_.length; i++) {
			this.calls_[i].notNow_ = false;
		}
	}
};

/**
 * Move time on this clock forward by the given amount and run whatever
 * pending calls should be run.
 *
 * If a callable adds another timeout or interval, it will not be run until
 * the next {@link advance} (even if the timeout was set to 0). This
 * makes the behavior unlike {@code twisted.internet.task.Clock},
 * where {@code advance} may call newly-added calls, and even get
 * stuck in a loop.
 *
 * If a callable throws an error, no more callables will be called. But if you
 * {@link advance} again, they will.
 *
 * @param {number} amount How many milliseconds by which to advance
 * 	this clock's time. Must be positive number; not NaN or Infinity.
 */
cw.clock.Clock.prototype.advance = function(amount) {
	if(amount < 0) {
		throw new cw.clock.ClockAdvanceError("amount was "+amount+", should have been > 0");
	}

	this.rightNow += amount;

	// Actually stop when it's time to
	var extraStopCondition = goog.bind(function() {
		return this.calls_[0].runAt_ > this.rightNow;
	}, this);

	this.internalAdvance_(extraStopCondition);
};

/**
 * Fire all of the scheduled calls indiscriminately (without regard to when
 * they are scheduled to fire).
 */
cw.clock.Clock.prototype.fireEverything = function() {
	var extraStopCondition = goog.functions.FALSE;
	this.internalAdvance_(extraStopCondition);
};

/**
 * Set the time on this clock to {@code time}. You may use this to move
 * the clock backwards. This will not call any scheduled calls, even if you move
 * it fowards.
 *
 * @param {number} time The new time for the clock.
 */
cw.clock.Clock.prototype.setTime = function(time) {
	this.rightNow = time;
};

// TODO: maybe implement and test pump, if needed

//	def pump(self, timings):
//		"""
//		Advance incrementally by the given set of times.
//
//		@type timings: iterable of C{float}
//		"""
//		for amount in timings:
//			self.advance(amount)


/*-----------------------------------------------------------------------------*/


/**
 * @type { {
 * 	setTimeout: function(!Function, number): number,
 * 	clearTimeout: function(number): undefined,
 * 	setInterval: function(!Function, number): number,
 * 	clearInterval: function(number): undefined
 * } }
 */
cw.clock.IWindowTimeAll = goog.typedef;


/**
 * @type { {
 * 	setTimeout: function(!Function, number): number,
 * 	clearTimeout: function(number): undefined
 * } }
 */
cw.clock.IWindowTimeIntervalOptional = goog.typedef;


/**
 * JumpDetector's event types.
 *
 * {@code getUniqueId} is used to allow Compiler to obfuscate the names.
 * See "Closure: The Definitive Guide", heading "setIdGenerators".
 * @enum {string}
 */
cw.clock.EventType = {
	TIME_JUMP: goog.events.getUniqueId('time_jump'),
	TIME_COLLECTION_OVERFLOW: goog.events.getUniqueId('time_collection_overflow')
};


/**
 * How much timer-firing inaccuracy (in milliseconds) to assume.
 * TODO: Write about how this impacts event firing
 * @const
 */
cw.clock.TIMER_FORGIVENESS = 400;


// TODO XXX: Detect if the environment fires timers if the clock went backwards
// (at least sometimes):
// 	- If the clock went backwards on the next poll_, fire MAYBE_MONOTONIC
//	- If the clock went backwards on a prod, preserve the old poll_ timer
//		and see if it fires in the "right amount of time" (it is not delayed for
//		too long). If so, fire MAYBE_MONOTONIC.

/**
 * JumpDetector detects fowards and backwards clock jumps for any browser,
 * regardless of how it schedules timers. Browsers schedule timers by system
 * time, monotonic clock, or an insane hybrid of both (in at least
 * Chromium/Windows and Safari/Windows). JumpDetector may be unable to
 * detect a backwards clock jump in Chromium/Windows, because it conceals
 * backwards time jumps. See [1]. JumpDetector also detects when the internal
 * timer is failing to fire, whether or not .getTime() has jumped. All of these
 * detections lead to a dispatching of a {@link TIME_JUMP} event, which has
 * three properties:
 * 	timeNow_: The time now.
 * 	timeLast_: The time last recorded, before a possible clock jump.
 * 	expectedFiringTime_: When the internal timer was expected to fire.
 * You should not strain too hard to extract meaning from the properties. Try
 * to care only about the dispatching of a {@link TIME_JUMP}. Especially do not
 * peek into the event properties to only reschedule calls on
 * "backwards time jumps". "Internal timer hasn't fired" events look like a
 * forward time jump, and it's very important to reschedule calls in this case.
 *
 * JumpDetector does not distinguish between "forwards time jump" and
 * "internal timer hasn't fired", because doing so would require
 * JumpDetector to know intimate details about how the browser schedules
 * timers. This information is hard to obtain and keep up to date.
 *
 * To detect time jumps and internal lack of firing, your application code must
 * call {@link prod} often. See its JSDoc.
 *
 * Note: if the browser freezes for a short time (or JavaScript execution is
 * suspended), this may dispatch a {@link TIME_JUMP}.
 *
 * JumpDetector also collects the time every {@code pollInterval} ms.
 * You can retreive the times and flush the internal
 * array with {@link getNewTimes}. If you forget to do this often enough,
 * {@link TIME_COLLECTION_OVERFLOW} will be dispatched with a property
 * {@code collection}.
 *
 * [1] {@link http://ludios.net/browser_bugs/clock_jump_test_page.html}
 * [2] {@link http://bugs.mysql.com/bug.php?id=44276}
 * 	also search for "backwards QueryPerformanceCounter"
 *
 * @param {!cw.clock.IWindowTimeAll} clock If !== goog.Timer.defaultTimerObject,
 * 	clock must implement getTime as well.
 *
 * @param {number} pollInterval Interval to poll at, in milliseconds. If this
 *	is too infrequent, and the clock jumps back in a non-monotonic browser,
 *	timeLast_ will be too obsolete. This will impact JumpDetectingClock,
 *	because the readjusted timers will take longer to fire than expected.
 *
 * @param {number} collectionSize Maximum size for time collection array
 * 	before dispatching {@link TIME_COLLECTION_OVERFLOW} and flushing.
 *
 * @constructor
 * @extends {goog.events.EventTarget}
 */
cw.clock.JumpDetector = function(clock, pollInterval, collectionSize) {
	goog.events.EventTarget.call(this);
	
	/**
	 * The clock to use. JumpDetector needs only `setTimeout` and
	 * `clearTimeout`, but users may correctly expect to also use
	 * JumpDetector.clock's `setInterval` and `clearInterval`.
	 * @type {cw.clock.IWindowTimeAll}
	 */
	this.clock = clock;

	/**
	 * @type {!Function}
	 * @private
	 */
	this.boundPoll_ = goog.bind(this.poll_, this);

	/**
	 * @type {number}
	 * @private
	 */
	this.pollInterval_ = pollInterval;

	/**
	 * @type {?number}
	 * @private
	 */
	this.expectedFiringTime_ = null;

	/**
	 * An array of times limited to length {@code collectionSize}, useful for recording
	 * and then uploading to the server. This information can be used to determine when
	 * the users' browser is locking up (although another tab may be responsible). This
	 * will contain {@code null}s which indicate that the next item represents the time
	 * when the internal timer was reset.
	 * @type {!Array.<number>}
	 * @private
	 */
	this.timeCollection_ = [];

	/**
	 * Maximum length for {@code this.timeCollection_} before
	 * {@link TIME_COLLECTION_OVERFLOW} is dispatched.
	 * @type {number}
	 * @private
	 */
	this.collectionSize_ = collectionSize;

	/**
	 * The last time we have seen, recorded either by the timer or by prodding.
	 * @type {?number}
	 * @private
	 */
	this.timeLast_ = null;
};
goog.inherits(cw.clock.JumpDetector, goog.events.EventTarget);

/**
 * A monotonically increasing time that usually resembles how much time
 * was actually spent on the page. In some browsers, if the clock jumps
 * backwards and JumpDetector is not being prodded, this will be
 * significantly less than the actual time spent on page.
 * @type {?number}
 */
cw.clock.JumpDetector.prototype.monoTime = null;

/**
 * @type {?number}
 * @private
 */
cw.clock.JumpDetector.prototype.pollerTicket_ = null;

/**
 * Set up a timer to check the time every {@code pollInterval_} milliseconds.
 * You really want to call this. Remember to call it after you've set up
 * event listeners.
 */
cw.clock.JumpDetector.prototype.start = function() {
	this.poll_();
};

/**
 * @param {?number} time A time, or {@code null}.
 * @private
 */
cw.clock.JumpDetector.prototype.insertIntoCollection_ = function(time) {
	if(this.timeCollection_.length >= this.collectionSize_) { /* >=, expect == */
		var collection = this.timeCollection_;
		this.timeCollection_ = [];
		this.dispatchEvent({
			type: cw.clock.EventType.TIME_COLLECTION_OVERFLOW,
			collection: collection
		});
	}
	this.timeCollection_.push(time);
};

/**
 * @return {!Array.<number>} Array of times collected since the page loaded,
 * 	since the last call to {@link getNewTimes}, or since an internal flushing.
 */
cw.clock.JumpDetector.prototype.getNewTimes = function() {
	var collection = this.timeCollection_;
	this.timeCollection_ = [];
	return collection;
};

/**
 * Set up a new internal timer. If necessary, you must clearTimeout the old
 * one yourself.
 * @param {number} now The time.
 * @private
 */
cw.clock.JumpDetector.prototype.setNewTimer_ = function(now) {
	this.pollerTicket_ = this.clock.setTimeout(this.boundPoll_, this.pollInterval_);
	this.expectedFiringTime_ = now + this.pollInterval_;
};

/**
 * Dispatch a {@link TIME_JUMP} event if necessary.
 * @param {number} now The current time, in milliseconds.
 * @param {boolean} prodded Whether this check was initiated by prodding.
 * @private
 */
cw.clock.JumpDetector.prototype.checkTimeJump_ = function(now, prodded) {
	// TODO: perhaps we should also fire something if the timer
	// fired too early? But does it really matter if it does?

	// Use a local variable to potentially speed up access times for IE6-IE8,
	// assuming Compiler preserves it.
	var timeLast = this.timeLast_;

	//cw.UnitTest.logger.info('checkTimeJump_: ' +
	//	cw.repr.repr({now:now, prodded:prodded, timeLast: timeLast, expectedFiringTime_: this.expectedFiringTime_}));

	if(timeLast != null && (now < timeLast || now > this.expectedFiringTime_ + cw.clock.TIMER_FORGIVENESS)) {
		this.dispatchEvent({
			type: cw.clock.EventType.TIME_JUMP,
			expectedFiringTime_: this.expectedFiringTime_,
			timeLast_: timeLast,
			timeNow_: now
		});
		// If prodded, it means we weren't called by the internal timer,
		// and we need to reset the timer to make sure it is called soon.
		if(prodded) {
			this.insertIntoCollection_(null); // a marker; see the JSDoc
			this.insertIntoCollection_(now);
			if(this.pollerTicket_ != null) {
				this.clock.clearTimeout(this.pollerTicket_);
			}
			this.setNewTimer_(now);
		}
	}
};

/**
 * @private
 */
cw.clock.JumpDetector.prototype.poll_ = function() {
	// We use a repeated setTimeout because setInterval is more likely
	// to be buggy. Proof of setInterval being buggy:
	// 1) https://bugzilla.mozilla.org/show_bug.cgi?id=376643
	//	The above is the bug that goog.Timer works around by using setTimeout
	// 2) http://ludios.net/browser_bugs/clock_jump_test_page.html
	//	See PROBLEMATIC(#3), which was confirmed in Firefox 2 through 3.6.
	//
	// We also prefer setTimeout because we're interested in timeCollection_,
	// and browsers are likely to automatically correct setInterval timers.

	// Trust goog.Timer.getTime to work all of the time.
	var now = goog.Timer.getTime(this.clock);

	try {
		if(this.monoTime == null) {
			this.monoTime = 0;
		} else {
			this.monoTime += this.pollInterval_;
		}

		this.insertIntoCollection_(now);
		this.checkTimeJump_(now, false/* prodded */);
		this.timeLast_ = now;
	} finally {
		this.setNewTimer_(now);
	}
};

/**
 * Your application code must call this when non-time-related events happen
 * (for example, key strokes or mouse clicks, focus events, network activity.)
 * If you don't make arrangements to call this, a backwards TIME_JUMP or
 * LACK_OF_FIRING might not be detected.
 *
 * Avoid calling this so frequently that the browser's CPU usage goes up.
 * You don't want users' laptop fans to spin up.
 */
cw.clock.JumpDetector.prototype.prod = function() {
	var now = goog.Timer.getTime(this.clock);
	this.checkTimeJump_(now, true/* prodded */);
	this.timeLast_ = now;
};

/**
 * Disposes of the object.
 */
cw.clock.JumpDetector.prototype.disposeInternal = function() {
	cw.clock.JumpDetector.superClass_.disposeInternal.call(this);

	if (this.pollerTicket_ != null) {
		this.clock.clearTimeout(this.pollerTicket_);
	}

	this.clock = this.pollerTicket_ = null;

	// elsewhere
	//this.dispatchEvent({type: evt.type, target: image});
};



/**
 * Notes for any future development of JumpDetectingClock:
 *
 * 1) setTimeout / setInterval is a bad API, because:
 * 	-	you cannot pass scope object, or arguments
 * 	-	setTimeout(func, 0) is really 3ms - 16ms depending on the browser,
 * 		and it's not implied that it's allowed to use a "faster" method
 * 		like an asynchronous postMessage.
 * 	We should probably make our own API.
 *
 * 2) The skeleton code below was designed only to correct for backwards
 * 		time jumps that prevent timeouts from firing at all.  Perhaps we
 * 		also need to work around timeouts firing too early, by splitting a
 * 		timeout into many subtimeouts.  In fact, we could even reuse
 * 		JumpDetector's interval.
 *
 * 3) JumpDetectingClock not be worth it in the first place, because by using
 * 		more frequent timeouts, we're draining many users' batteries, just to
 * 		prevent a very rare problem.  We might want to use it only for
 * 		critical applications, demos, and when we know we're not running
 * 		on battery power.  Or we might selectively enable JumpDetector
 * 		at critical moments - for example, when a computer is waking up
 * 		from sleep (and might very soon adjust its clock).  At least, if we
 * 		can even detect these "critical moments".
 */

// TODO XXX: JumpDetectingClock is going to want to check *all*
// of the timers when prodded, because perhaps just one got
// mischeduled by the browser.

// TODO XXX: Allow calling a errorHandlerFn_ on error like goog.debug.errorhandler.
// We want to avoid protectWindowSetTimeout because that adds too many
// layers of functions. We already *need* to create a function in JumpDetectingClock.
// BUT: is this really necessary? In all browsers but Opera, window.onerror
// should do adequate error-detection for us.

/**
 * DOES NOT ACTUALLY WORK YET - DO NOT USE
 *
 * This is a clock that detects backwards time jumps and reschedules
 * calls if necessary. It wraps an existing clock, such as a real browser
 * Window or a deterministic cw.clock.Clock.
 *
 * Use JumpDetectingClock in all browsers, even in those where you
 * have confidence that timers are scheduled with a monotonic clock.
 * You can't be sure that timers are always scheduled with a monotonic
 * clock. For example, you might find a browser with a workaround to
 * avoid using the monotonic clock on Athlon X2 CPUs (Chromium does
 * this.)
 *
 * Note: because setInterval is buggy in Firefox on backwards time jumps [1],
 * and because it's more likely to be buggy in general, you should still
 * prefer to use setTimeout (and goog.Timer) over setInterval.
 *
 * [1] http://ludios.net/browser_bugs/clock_jump_test_page.html
 *
 * @param {!cw.clock.JumpDetector} jumpDetector An already-started
 * 	{@link cw.clock.JumpDetector}.
 *
 * @constructor
 */
cw.clock.JumpDetectingClock = function(jumpDetector) {
	/**
	 * @type {!cw.clock.JumpDetector}
	 * @private
	 */
	this.jumpDetector_ = jumpDetector;

	/**
	 * The underlying clock to use.
	 * @type {cw.clock.IWindowTimeAll}
	 */
	this.clock = jumpDetector.clock;

	/**
	 * Both setTimeouts and setIntervals are tracked here.
	 *
	 * In the array for each property value, the
	 * [0]th item is true for intervals, and false for timeouts.
	 * [1]th item is the delay between calls for intervals, and the timeout for timeouts.
	 * [2]th item is the expected next firing time. 
	 *
	 * @type {!Object.<number, !Array.<(boolean|number)>>}
	 * // TODO: types for tuples
	 * @private
	 */
	this.timeouts_ = {};

	jumpDetector.addEventListener(
		cw.clock.EventType.TIME_JUMP, this.gotTimeJump_, true, this);
};

/**
 * Get the current time.
 * Our modified version of goog.Timer expects this to be implemented.
 * @return {number} The current time.
 */
cw.clock.JumpDetectingClock.prototype.getTime = function() {
	return goog.Timer.getTime(this.clock);
};

/**
 * @param {number} adjustment By how many milliseconds to adjust the timeout
 * 	for the rescheduled timeouts. Note: intervals cannot be adjusted, so they may
 * 	take longer to fire.  If this receives too many spurious TIME_JUMP events,
 * 	intervals may never fire. You should avoid using setInterval in general
 * 	(use goog.Timer instead).
 * @private
 */
cw.clock.JumpDetectingClock.prototype.rescheduleCalls_ = function(adjustment) {
	for(var ticket in this.timeouts_) {
		if(Object.prototype.hasOwnProperty.call(this.timeouts_, ticket)) {
			this.clock.clearTimeout(Number(ticket));
		}
	}
	throw Error("NIY");
};

/**
 * @private
 */
cw.clock.JumpDetectingClock.prototype.gotTimeJump_ = function(ev) {
	// We must never call any scheduled timeouts synchronously here,
	// because the current stack sometimes looks like this,
	// 	user code
	//		JumpDetector.prod
	//			goog.events
	//				JumpDetectingClock.gotTimeJump_
	// and user code assumes that timeouts are called directly from some
	// kind of event loop (never under its current stack).

	throw Error("NIY");
	//var adjustment = 1/0;
	//this.rescheduleCalls_(adjustment);
};

/**
 * A jump-correcting version of {@code window.setTimeout}.
 *
 * @param {!Function} callable The callable to call soon.
 * @param {number} delay When to call {@code callable}, in milliseconds.
 *
 * @return {number} The ticket number for the added event.
 */
cw.clock.JumpDetectingClock.prototype.setTimeout = function(callable, delay) {
	var now = this.getTime();
	var that = this;
	var ticket = this.clock.setTimeout(function() {
		delete that.timeouts_[ticket];
		callable.call(null);
	}, delay);
	this.timeouts_[ticket] = [false, delay, now + delay];
	return ticket;
};

/**
 * A jump-correcting version of {@code window.setInterval}.
 *
 * @param {!Function} callable The callable to call soon (possibly repeatedly).
 * @param {number} interval The delay between calls to {@code callable},
 * 	in milliseconds. If you want to, you may specify 0.
 *
 * @return {number} The ticket number for the added event.
 */
cw.clock.JumpDetectingClock.prototype.setInterval = function(callable, interval) {
	var now = this.getTime();
	var that = this;
	var ticket = this.clock.setInterval(function() {
		now = this.getTime();
		that.timeouts_[ticket][2] = now;
		callable.call(null);
	}, interval);
	this.timeouts_[ticket] = [true, interval, now + interval]; // [2]th represents "next firing time"
	return ticket;
};

/**
 * A jump-detecting version of {@code window.clearTimeout}.
 *
 * @param {number} ticket The ticket number of the timeout/interval to clear.
 */
cw.clock.JumpDetectingClock.prototype.clearTimeout = function(ticket) {
	this.clock.clearTimeout(ticket);
	delete this.timeouts_[ticket];
};

/**
 * A jump-detecting version of {@code window.clearInterval}.
 *
 * @param {number} ticket The ticket number of the timeout/interval to clear.
 */
cw.clock.JumpDetectingClock.prototype.clearInterval = function(ticket) {
	this.clock.clearInterval(ticket);
	delete this.timeouts_[ticket];
};

// Do we want a disposeInternal that clears all the timeouts and intervals?
// Is that a sane thing to do, given what could be going on as the page unloads?


/*
The composition in a real application would be:
	CallQueue
		JumpDetectingClock
			JumpDetector
				Window (or Clock for testing)

*/

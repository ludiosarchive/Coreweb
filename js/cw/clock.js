/**
 * Deterministic clock and helpers
 */

goog.require('goog.asserts');
goog.require('goog.debug.Error');

goog.provide('cw.clock');

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
 * Provide a deterministic, easily-controlled browser C{window}.
 * This is commonly useful for writing deterministic unit tests for code which
 * schedules events with C{setTimeout}, C{setInterval}, C{clearTimeout},
 * and {clearInterval}.
 *
 * Note that this does not mimic browser deficiencies in C{setTimeout} and
 * C{setInterval}. For example, the C{1} in C{setTimeout(callable, 1)} will not
 * be raised to C{13}.
 *
 * Note: we must use .pmethods instead of .methods here, because IE leaks
 * named functions into the outer scope, and we really can't deal with that here,
 * because the function names are "setTimeout" and so on.
 * 
 * @constructor
 */
cw.clock.Clock = function() {
	/**
	 * @type {number}
	 */
	this.rightNow_ = 0.0;

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

	var thisClock = this;

	/**
	 * The deterministic version of {@code Date.getTime}.
	 * 
	 * @return {number} "Milliseconds since epoch", but really just
	 * 	the {@code Clock}'s time.
	 */
	this.Date.prototype.getTime = function() {
		return thisClock.rightNow_;
	}

	// TODO: more Date functions, in case anything needs them.
	// The general strategy to implement `someMethod' would be:
	//    return new Date(thisClock.rightNow_).someMethod();
}

/**
 * @private
 */
cw.clock.Clock.prototype.addCall_ = function(call) {
	this.calls_.push(call);
	this.sortCalls_();
}

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
}

/**
 * The deterministic version of {@code window.setTimeout}.
 *
 * @param {!Function} callable The callable to call soon
 * @param {number} when When to call {@code callable}, in milliseconds.
 *
 * @return {number} The ticket number for the added event.
 */
cw.clock.Clock.prototype.setTimeout = function(callable, when) {
	this.addCall_({
		ticket_: ++this.ticketCounter_,
		runAt_: this.rightNow_ + when,
		notNow_: this.advancing_,
		callable_: callable,
		respawn_: false,
		interval_: null
	});
	return this.ticketCounter_;
}

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
		runAt_: this.rightNow_ + interval,
		nowNow_: this.advancing_,
		callable_: callable,
		respawn_: true,
		interval_: interval
	});
	return this.ticketCounter_;
}

/**
 * For use by unit tests ONLY.
 * @private
 */
cw.clock.Clock.prototype.getCallsArray_ = function() {
	return this.calls_;
}

/**
 * Remove a timeout or interval from calls_, by ticket number.
 *
 * Notes: in both Firefox 3.5.3 and IE8, you can successfully clearTimeout() an interval,
 * and clearInterval() a timeout, so here we don't check the timeout/interval type.
 *
 * @private
 */
cw.clock.Clock.prototype._clearAnything = function(ticket) {
	var n = this.calls_.length;
	while(n--) {
		var call = this.calls_[n];
		if(call.ticket_ === ticket) {
			var ret = this.calls_.splice(n, 1);
			goog.asserts.assert(ret[0].ticket_ === ticket, ret[0].ticket_ + " !== " + ticket);
			break;
		}
	}
}

/**
 * The deterministic version of {@code window.clearTimeout}.
 *
 * @param {number} ticket The ticket number of the timeout/interval to clear.
 */
cw.clock.Clock.prototype.clearTimeout = function(ticket) {
	this._clearAnything(ticket);
}

/**
 * The deterministic version of {@code window.clearInterval}.
 *
 * @param {number} ticket The ticket number of the timeout/interval to clear.
 */
cw.clock.Clock.prototype.clearInterval = function(ticket) {
	this._clearAnything(ticket);
}

/**
 * Move time on this clock forward by the given amount and run whatever
 * pending calls should be run.
 *
 * If a callable adds another timeout or interval, it will not be run until
 * the next {@code advance_} (even if the timeout was set to 0).
 *
 * If a callable throws an error, no more callables will be called. But if you
 * {@code advance_} again, they will.
 *
 * @param {number} amount How many seconds by which to advance_
 * 	this clock's time. Must be positive number; not NaN or Infinity.
 */
cw.clock.Clock.prototype.advance_ = function(amount) {
	if(this.advancing_) {
		throw new cw.clock.ClockAdvanceError("You cannot re-entrantly advance the Clock.");
	}

	if(amount < 0) {
		throw new cw.clock.ClockAdvanceError("amount was "+amount+", should have been > 0");
	}

	this.advancing_ = true;

	try {
		this.rightNow_ += amount;

		// Remember that callables can add or clear timeouts/intervals.
		// New callables won't get called until at least the next advance_,
		// but cleared timeouts/intervals will be immediately removed, even
		// while we're inside this loop.
		for(;;) {
			//console.log('calls_: ', cw.UnitTest.repr(this.calls_), 'rightNow_: ', this.rightNow_);
			if(this.calls_.length === 0 || this.calls_[0].runAt_ > this.rightNow_ || this.calls_[0].notNow_) {
				break;
			}
			var call = this.calls_.shift();

			// If it needs to be respawned, do it now, before calling the callable,
			// because the callable may raise an exception. Also because the
			// callable may want to clear its own interval.
			if(call.respawn_ === true) {
				call.runAt_ += call.interval_;
				this.addCall_(call);
			}

			// Make sure `this' is the global object for callable (making `this'
			// "worthless" like it is when the real setTimeout calls you.) Note that
			// for callable, `this' becomes `window', not `null'.
			//call.callable.apply(null, []); // Doesn't work in Opera 10.50
			call.callable_.call(null);
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
}

// TODO: maybe implement and test pump, if needed

//	def pump(self, timings):
//		"""
//		Advance incrementally by the given set of times.
//
//		@type timings: iterable of C{float}
//		"""
//		for amount in timings:
//			self.advance_(amount)


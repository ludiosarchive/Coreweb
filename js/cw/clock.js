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
	 * @private
	 */
	this._rightNow = 0.0;

	/**
	 * @type {number}
	 * @private
	 */
	this._counter = -1;

	/**
	 * @type {boolean}
	 * @private
	 */
	this._advancing = false;

	/**
	 * @type {!Array.<{
	 * 		ticket: number,
	 * 		runAt: number,
	 * 		notNow: boolean,
	 * 		callable: !Function,
	 * 		respawn: boolean,
	 * 		interval: ?number
	 * 	}>}
	 * @private
	 */
	this._calls = [];

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
		return thisClock._rightNow;
	}

	// TODO: more Date functions, in case anything needs them.
	// The general strategy to implement `someMethod' would be:
	//    return new Date(thisClock._rightNow).someMethod();
}

/**
 * @private
 */
cw.clock.Clock.prototype._addCall = function(call) {
	this._calls.push(call);
	this._sortCalls();
}

/**
 * @private
 */
cw.clock.Clock.prototype._sortCalls = function() {
	// We could sort by (x.notNow, x.runAt, x.ticket) but that would be less
	// like browsers, where there is no guarantee of order.
	this._calls.sort(function(a, b) {
		// "nowNow" calls are shoved to the end of the array
		var aPriority = a.runAt + (a.notNow ? 4294967296 : 0);
		var bPriority = b.runAt + (b.notNow ? 4294967296 : 0);
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
	this._addCall({
		ticket: ++this._counter,
		runAt: this._rightNow + when,
		notNow: this._advancing,
		callable: callable,
		respawn: false,
		interval: null
	});
	return this._counter;
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
	this._addCall({
		ticket: ++this._counter,
		runAt: this._rightNow + interval,
		nowNow: this._advancing,
		callable: callable,
		respawn: true,
		interval: interval
	});
	return this._counter;
}


/**
 * For the unit tests.
 * @private
 */
cw.clock.Clock.prototype._countPendingEvents = function() {
	return this._calls.length;
}


/**
 * For the unit tests.
 * @private
 */
cw.clock.Clock.prototype._isTicketInEvents = function(ticket) {
	var haveIt = false;
	var n = this._calls.length;
	while(n--) {
		var call = this._calls[n];
		if(call.ticket === ticket) {
			haveIt = true;
		}
	}
	return haveIt;
}


/**
 * For the unit tests.
 * @private
 */
cw.clock.Clock.prototype._getNextTicketNumber = function() {
	return this._counter + 1;
}


/**
 * For the unit tests.
 * @private
 */
cw.clock.Clock.prototype._getCallsArray = function() {
	return this._calls;
}


/**
 * Remove a timeout or interval from _calls, by ticket number.
 *
 * Notes: in both Firefox 3.5.3 and IE8, you can successfully clearTimeout() an interval,
 * and clearInterval() a timeout, so here we don't check the timeout/interval type.
 *
 * @private
 */
cw.clock.Clock.prototype._clearAnything = function(ticket) {
	var n = this._calls.length;
	while(n--) {
		var call = this._calls[n];
		if(call.ticket === ticket) {
			var ret = this._calls.splice(n, 1);
			goog.asserts.assert(ret[0].ticket === ticket, ret[0].ticket + " !== " + ticket);
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
 * the next {@code advance} (even if the timeout was set to 0).
 *
 * If a callable throws an error, no more callables will be called. But if you
 * {@code advance} again, they will.
 *
 * @param {number} amount How many seconds by which to advance
 * 	this clock's time. Must be positive number; not NaN or Infinity.
 */
cw.clock.Clock.prototype.advance = function(amount) {
	// Remember that callables can re-entrantly call advance(...), as
	// well as add or clear timeouts/intervals. Don't try stupid optimization
	// tricks.


	if(this._advancing) {
		throw new cw.clock.ClockAdvanceError("You cannot re-entrantly advance the Clock.");
	}

	if(amount < 0) {
		throw new cw.clock.ClockAdvanceError("amount was "+amount+", should have been > 0");
	}

	this._advancing = true;

	try {
		this._rightNow += amount;

		for(;;) {
			//console.log('_calls: ', cw.UnitTest.repr(this._calls), '_rightNow: ', this._rightNow);
			if(this._calls.length === 0 || this._calls[0].runAt > this._rightNow || this._calls[0].notNow) {
				break;
			}
			var call = this._calls.shift();

			// If it needs to be respawned, do it now, before calling the callable,
			// because the callable may raise an exception. Also because the
			// callable may want to clear its own interval.
			if(call.respawn === true) {
				call.runAt += call.interval;
				this._addCall(call);
			}

			// Make sure `this' is the global object for callable (making `this'
			// "worthless" like it is when the real setTimeout calls you.) Note that
			// for callable, `this' becomes `window', not `null'.
			//call.callable.apply(null, []); // Doesn't work in Opera 10.50
			call.callable.call(null);
			// Opera 10.50 has a serious miscompilation issue and strips the
			// `apply` property on the callable after re-entrant calls happen.
			// See http://ludios.net/opera_bugs/opera_10_50_reentrant_array.html
			// The bug was reported to Opera as DSK-285105. `call.callable.call(null);`
			// still works, so we use that.
		}
	} finally {
		this._advancing = false;

		for(var i=0; i < this._calls.length; i++) {
			this._calls[i].notNow = false;
		}
	}
}

// TODO: maybe implement and test pump, if needed

//	def pump(this, timings):
//		"""
//		Advance incrementally by the given set of times.
//
//		@type timings: iterable of C{float}
//		"""
//		for amount in timings:
//			this.advance(amount)


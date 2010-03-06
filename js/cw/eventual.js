/**
 * This module is an improvement to using setTimeout(..., 0)
 * to "avoid bugs" in browsers.
 * 
 * Unlike setTimeout, callables scheduled in a CallQueue
 * are guaranteed to be called in order. Also, callables scheduled
 * from inside a CallQueue-called callable are called only after
 * control is once again returned to the environment's event loop.
 *
 * CallQueue is especially useful for client-side code because browsers
 * have a tendency to crash or exhibit undefined behavior when
 * entering user JavaScript code from an event handler. The source
 * of these issues are re-entrancy bugs in nearly every web browser.
 * When the browser enters user JavaScript code from a queued
 * setTimeout call, the browser's stack is smaller and in a much better-
 * tested codepath, and therefore less likely to crash.
 * 
 * Inside your non-setTimeout event callbacks, by minimizing the work
 * you do to a CallQueue.eventually_, you reduce the chance of
 * hitting a re-entrancy bug.
 *
 * CallQueue is also very useful when making Flash->JavaScript calls
 * with ExternalInterface, because Flash catches all Errors and ignores
 * them.
 *
 * General note: In server-side code, you have the opportunity to write
 * extensive unit tests to verify that you have no re-entrancy bugs. You can't
 * do this for client-side code because you have no idea what browser
 * the user will arrive with. Every event dispatched by the browser
 * is a disaster waiting to happen.
 *
 * This is a port of {@code foolscap.eventual}, with less globalness,
 * because clocks should usually be parameterized.
 * The foolscap.eventual->cw.eventual translation guide:
 * 	use of global queue encouraged -> use discouraged
 * 	_SimpleCallQueue -> CallQueue
 * 	flushEventualQueue -> notifyEmpty_
 * 	_flushObservers -> emptyObservers_
 *
 * LICENSE: Coreweb, Foolscap
 */

goog.require('goog.async.Deferred');
goog.require('goog.asserts');

goog.provide('cw.eventual');

/**
 * A call queue that supports the eventually operation, for
 * a specific clock. You should probably have just one CallQueue
 * for your application. Pass one CallQueue around just like you
 * would pass a clock around. In fact, you can skip passing a clock
 * around, because you pass a CallQueue around, and just access
 * the clock via the {@code clock_} property.
 *
 * @constructor
 */
cw.eventual.CallQueue = function(clock) {
	/**
	 * An object that implements {@code setTimeout}.
	 * @type { {setTimeout: !Function} }
	 */
	this.clock_ = clock;

	/**
	 * Array of callables to eventually call.
	 * @type {!Array.<!Array.<!Function, Object, !Array<*>>>}
	 * @private
	 */
	this.events_ = [];

	/**
	 * Array of notifyEmpty observers
	 * @type {!Array.<!goog.async.Deferred>}
	 * @private
	 */
	this.emptyObservers_ = [];

	/**
	 * Just for optimization: {@code this.turn_} bound to {@code this}.
	 * @type {!Function}
	 * @private
	 */
	this.boundTurn_ = goog.bind(this.turn_, this);
}

/**
 * The ID of the current setTimeout call, or {@code null}.
 *
 * @type {?number}
 * @private
 */
cw.eventual.CallQueue.prototype.timer_ = null;

/**
 * Add a callable (with scope and arguments) to the call queue.
 * The callable will be invoked with {@code cb.apply(scope, args)}
 * after control is returned to the environment's event loop. Doing
 * 'eventually_(a); eventually_(b)' guarantees that a will be called before b.
 *
 * Any exceptions that occur in the callable will be rethrown to the window,
 * in a manner similar to {@code goog.async.Deferred}.
 * If you really want to ignore exceptions, be sure to provide a callable that
 * catches those exceptions.
 *
 * If you care to know when the callable was run, be sure to provide a
 * callable that notifies somebody.
 *
 * @param {!Function} cb The function to be called eventually.
 * @param {Object} scope The scope to call {@code cb} in.
 * @param {!Array<*>} args The arguments the function will be called with.
 */
cw.eventual.CallQueue.prototype.eventually_ = function(cb, scope, args) {
	goog.asserts.assert(goog.isArray(args),
		"args should be an array, not " + goog.typeOf(args));

	this.events_.push([cb, scope, args]);
	if(this.timer_ == null) {
		this.timer_ = this.clock_.setTimeout(this.boundTurn_, 0);
	}
}

/**
 * @private
 */
cw.eventual.CallQueue.prototype.turn_ = function() {
	this.timer_ = null;
	// Flush all the messages that are currently in the queue. If anything
	// gets added to the queue while we're doing this, those events will
	// be put off until the next call to _turn.
	var events = this.events_;
	this.events_ = [];
	for (var i = 0; i < events.length; i++) {
		var event = events[i];
		var cb = event[0];
		var scope = event[1];
		var args = event[2];
		try {
			cb.apply(scope, args);
		} catch(e) {
			this.clock_.setTimeout(function() {
				// Rethrow the unhandled error after a timeout.
				// Execution will continue, but the error will be seen
				// by global handlers and the user.
				throw e;
			}, 0);
		}
	}
	if(this.events_.length && this.timer_ == null) {
		this.timer_ = this.clock_.setTimeout(this.boundTurn_, 0);
	}
	if(this.events_.length == 0) {
		var observers = this.emptyObservers_;
		this.emptyObservers_ = [];
		for (var i = 0; i < observers.length; i++) {
			observers[i].callback(null);
		}
	}
	// Have some faith, there is probably no re-entrancy bug
	// involving notifyEmpty_ here. Think about it.
}

/**
 * @return {!goog.async.Deferred} A Deferred that will fire with {@code null}
 * when the call queue is completely empty.
 */
cw.eventual.CallQueue.prototype.notifyEmpty_ = function() {
	if(this.events_.length == 0) {
		return goog.async.Deferred.succeed(null);
	}
	var d = new goog.async.Deferred();
	this.emptyObservers_.push(d);
	return d;
}

/**
 * @param {*} value The value that the Deferred will callback with.
 *
 * @return {!goog.async.Deferred} A Deferred that will fire sometime
 * after control has returned to the environment's event loop, and after the
 * current call stack has been completed (including deferreds previously
 * scheduled with fireEventually).
 */
cw.eventual.CallQueue.prototype.fireEventually_ = function(value) {
	var d = new goog.async.Deferred();
	this.eventually_(d.callback, d, [value]);
	return d;
}



/**
 * A global {@code CallQueue} for {@code window}. Don't use this if
 * you want to be able to drive your application with a deterministic clock
 * (and you probably do).
 * 
 * @type {!cw.eventual.CallQueue}
 */
cw.eventual.theQueue_ = new cw.eventual.CallQueue(goog.global['window']);

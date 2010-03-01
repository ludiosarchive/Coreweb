/**
 * This is almost a straight port of {@code foolscap.eventual}.
 *
 * This module is an improvement to sometimes using
 * {@code setTimeout(..., 0)} to "avoid bugs" in browsers.
 * Unlike setTimeout, callables scheduled in a SimpleCallQueue
 * are guaranteed to be called in order. Also, callables scheduled
 * from inside a SimpleCallQueue-called callable are called only after
 * control is returned to the environment's event loop.
 *
 * This is especially useful for client-side code because browsers
 * have a tendency to crash or exhibit undefined behavior when
 * entering user JavaScript code from an event handler. The source
 * of these issues are re-entrancy bugs in nearly every web browser.
 *
 * This is also very useful when making Flash->JavaScript calls
 * with ExternalInterface, because Flash catches all Errors and ignores
 * them.
 *
 * In server-side code, you have the opportunity to write extensive
 * unit tests to verify that you have no re-entrancy bugs. You can't
 * do this for client-side code because you have no idea what browser
 * the user will arrive with. Every event dispatched by the browser
 * is a disaster waiting to happen. So learn to love {@code cw.eventual}.
 *
 * LICENSE: Coreweb, Foolscap
 */

goog.require('goog.async.Deferred');
goog.require('goog.asserts');

goog.provide('cw.eventual');

/**
 * @constructor
 * @private
 */
cw.eventual.SimpleCallQueue = function(clock) {
	/**
	 * An object that implements {@code setTimeout}.
	 * @type {Object}
	 * @private
	 */
	this.clock_ = clock;

	/**
	 * Array of callables to eventually call.
	 * @type {!Array.<!Array.<!Function, Object, !Array<*>>>}
	 * @private
	 */
	this.events_ = [];

	/**
	 * Array of flush observers; see {@code flushEventualQueue}
	 * @type {!Array.<!goog.async.Deferred>}
	 * @private
	 */
	this.flushObservers_ = [];

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
cw.eventual.SimpleCallQueue.prototype.timer_ = null;

/**
 * Add a callable (with context and arguments) to the call queue.
 * The callable will be invoked with {@code cb.apply(context, args)}
 * after control is returned to the environment's event loop. Doing
 * 'append_(a); append_(b)' guarantees that a will be called before b.
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
 * @param {Object} context Object in whose scope to call {@code cb}.
 * @param {!Array<*>} args The arguments the function will be called with.
 */
cw.eventual.SimpleCallQueue.prototype.append_ = function(cb, context, args) {
	goog.asserts.assert(goog.typeOf(args) == 'array',
		"args should be an array, not " + goog.typeOf(args));

	this.events_.push([cb, context, args]);
	if(this.timer_ == null) {
		this.timer_ = this.clock_.setTimeout(this.boundTurn_, 0);
	}
}

/**
 * @private
 */
cw.eventual.SimpleCallQueue.prototype.turn_ = function() {
	this.timer_ = null;
	// Flush all the messages that are currently in the queue. If anything
	// gets added to the queue while we're doing this, those events will
	// be put off until the next call to _turn.
	var events = this.events_;
	this.events_ = [];
	for (var i = 0; i < events.length; i++) {
		var event = events[i];
		var cb = event[0];
		var context = event[1];
		var args = event[2];
		try {
			cb.apply(context, args);
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
		var observers = this.flushObservers_;
		this.flushObservers_ = [];
		for (var i = 0; i < observers.length; i++) {
			observers[i].callback(null);
		}
	}
}

/**
 * @return {!goog.async.Deferred} A Deferred that will fire with {@code null}
 * when the call queue is completely empty.
 */
cw.eventual.SimpleCallQueue.prototype.flush_ = function() {
	if(this.events_.length == 0) {
		return goog.async.Deferred.succeed(null);
	}
	var d = new goog.async.Deferred();
	this.flushObservers_.push(d);
	return d;
}


/**
 * @private
 * @type {!cw.eventual.SimpleCallQueue}
 */
cw.eventual.theSimpleQueue_ = cw.eventual.SimpleCallQueue(goog.global['window']);

/**
 * Calls {@code append_} on the global SimpleCallQueue.
 *
 * {@see cw.eventual.SimpleCallQueue.prototype.append_}
 *
 * @param {!Function} cb The function to be called eventually.
 * @param {Object} context Object in whose scope to call {@code cb}.
 * @param {!Array<*>} args The arguments the function will be called with.
 */
cw.eventual.eventually = function(cb, context, args) {
	cw.eventual.theSimpleQueue_.append_(cb, context, args);
}


/**
 * This returns a Deferred that will fire sometime after control has returned
 * to the environment's event loop, after the current call stack has been
 * completed, and after all other deferreds previously scheduled with
 * {@code cw.eventual.eventually()}.
 *
 * @param {*} value The value that the Deferred will callback with. Can
 * 	be anything.
 *
 * @return {!goog.async.Deferred}
 */
cw.eventual.fireEventually = function(value) {
	var d = new goog.async.Deferred();
	cw.eventual.eventually(goog.bind(d.callback, d), value);
	return d;
}


/**
 * @return {!goog.async.Deferred} A Deferred that will fire with {@code null}
 * when the global call queue is completely empty. This may be useful to wait
 * on as the last step of a test method.
 */
cw.eventual.flushEventualQueue = function() {
    return cw.eventual.theSimpleQueue_.flush();
}

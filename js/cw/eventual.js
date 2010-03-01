/**
 * LICENSE: Coreweb, Foolscap
 */

goog.require('goog.async.Deferred');
goog.require('goog.Timer');

goog.provide('cw.eventual')

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
	 * @type {!Array.<!Array.<!Function, !Array<*>>>}
	 * @private
	 */
	this.events_ = [];

	/**
	 * @type {!Array.<!goog.async.Deferred>}
	 * @private
	 */
	this.flushObservers_ = [];
}

/**
 * The ID of the current setTimeout call, or {@code null}.
 *
 * @type {?number}
 * @private
 */
cw.eventual.SimpleCallQueue.prototype.timer_ = null;


cw.eventual.SimpleCallQueue.prototype.append_ = function(cb, args) {
	this.events_.push([cb, args]);
	if(this.timer_ == null) {
		this.timer_ = this.clock_.setTimeout(goog.bind(this.turn_, this), 0);
	}
}

/**
 * @private
 */
cw.eventual.SimpleCallQueue.prototype.turn_ = function() {
	this.timer_ = null;
	// flush all the messages that are currently in the queue. If anything
	// gets added to the queue while we're doing this, those events will
	// be put off until the next call to _turn.
	var events = this.events_;
	this.events_ = [];
	for (var i = 0; i < events.length; i++) {
		var event = events[i];
		var cb = event[0];
		var args = event[1];
		try {
			cb(args);
		} catch(e) {
			this.clock_.setTimeout(function() {
				// Rethrow the unhandled error after a timeout.
				// Execution will continue, but the error will be seen
				// by global handlers and the user.
				throw e;
			}, 0);
		}
	}
	if(this.events_.length > 0 && this.timer_ == null) {
		this.timer_ = this.clock_.setTimeout(goog.bind(this.turn_, this), 0);
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
 * Return a Deferred that will fire (with {@code null}) when the call queue
 * is completely empty.
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
 * This is the eventual-send operation, used as a plan-coordination
 * primitive. The callable will be invoked (with args and kwargs) after
 * control is returned to the environment's event loop. Doing
 * 'eventually(a); eventually(b)' guarantees that a will be called before b.
 *
 * Any exceptions that occur in the callable will be logged with log.err(). < XXXXXXXXXXXXXXXXX
 * If you really want to ignore them, be sure to provide a callable that
 * catches those exceptions.
 *
 * If you care to know when the callable was run, be sure to provide a
 * callable that notifies somebody.
 *
 * @param {!Function} cb The function to be called eventually.
 * @param {!Array<*>} args The arguments the function will be called with.
 */
cw.eventual.eventually = function(cb, args) {
	cw.eventual.theSimpleQueue_.append_(cb, args);
}


/**
 * This returns a Deferred which will fire sometime after control has returned
 * to the environment's event loop, after the current call stack has been
 * completed, and after all other deferreds previously scheduled with
 * {@code callEventually()}.
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
 * This returns a Deferred which fires when the eventual-send queue is
 * finally empty. This is useful to wait upon as the last step of a Trial
 * test method.
 *
 * @return {!goog.async.Deferred}
 */
cw.eventual.flushEventualQueue = function() {
    return cw.eventual.theSimpleQueue_.flush();
}

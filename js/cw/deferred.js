/**
 * Additional utilities for {@code goog.async.Deferred}s.
 */

goog.provide('cw.deferred');

goog.require('goog.async.Deferred');


/**
 * Invoke a function that may or may not return a Deferred.
 *
 * Call the given function with the given arguments.  If the returned
 * object is a {@code Deferred}, return it.  If the returned object is an
 * {@code Error}, wrap it with {@code fail} and return it.  Otherwise, wrap
 * it with {@code succeed} and return it.  If an exception is raised, wrap it
 * with {@code fail} and return it.
 *
 * @param {!Function} f The function to invoke
 * @param {Array.<*>=} opt_args Arguments for the function
 *
 * @return {!goog.async.Deferred} The deferred object.
 */
cw.deferred.maybeDeferred = function(f, opt_args) {
	try {
		var result = f.apply(null, opt_args ? opt_args : []);
	} catch(e) {
		return goog.async.Deferred.fail(e);
	}

	if (result instanceof goog.async.Deferred) {
		return result;
	} else if(result instanceof Error) {
		return goog.async.Deferred.fail(result);
	} else {
		return goog.async.Deferred.succeed(result);
	}
};

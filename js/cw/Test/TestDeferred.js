/**
 * @fileoverview Tests for cw.deferred
 */

goog.provide('cw.Test.TestDeferred');

goog.require('cw.UnitTest');
goog.require('goog.async.Deferred');
goog.require('cw.deferred');


// anti-clobbering for JScript; aliases
(function(){

var maybeDeferred = cw.deferred.maybeDeferred;

cw.UnitTest.TestCase.subclass(cw.Test.TestDeferred, 'MaybeDeferredTests').methods(
	// These tests are adapted from Twisted's tests for maybeDeferred.

	/**
	 * L{maybeDeferred} should retrieve the result of a synchronous
	 * function and pass it to its resulting L{Deferred}.
	 */
	function test_maybeDeferredSync(self) {
		var S = [], E = [];
		var d = maybeDeferred(function(x) {
			return x + 5;
		}, [10]);
		d.addCallbacks(
			function(s) {
				S.push(s);
				return null;
			},
			function(err) {
				E.push(err);
				return null;
			}, [], []);

		self.assertEqual([], E);
		self.assertEqual([15], S);
		return d
	},

	/**
	 * L{maybeDeferred} should catch exception raised by a synchronous
	 * function and errback its resulting L{Deferred} with it.
	 */
	function test_maybeDeferredSyncError(self) {
		var S = [], E = [];
		try {
			throw Error("boom");
		} catch(e) {
			var expected = e.message;
		}
		var d = maybeDeferred(function() {
			throw Error("boom");
		});
		d.addCallbacks(
			function(s){
				S.push(s);
				return null;
			},
			function(err){
				E.push(err);
				return null;
			}, [], []);

		self.assertEqual([], S);
		self.assertEqual(1, E.length);
		self.assertEqual(expected, E[0].message);
		return d;
	},

	/**
	 * L{maybeDeferred} should let L{Deferred} instance pass by
	 * so that original result is the same.
	 */
	function test_maybeDeferredAsync(self) {
		var ok = false;
		var d = new goog.async.Deferred();
		var d2 = maybeDeferred(function() {
			return d;
		});
		d.callback('Success');
		d2.addCallback(function(s) {
			self.assertEqual(s, 'Success');
			ok = true;
			return null;
		});
		self.assertTrue(ok);
	},

	/**
	 * L{maybeDeferred} should let L{Deferred} instance pass by
	 * so that L{Error} returned by the original instance is the
	 * same.
	 */
	function test_maybeDeferredAsyncError(self) {
		var d = new goog.async.Deferred();
		var d2 = maybeDeferred(function() {
			return d;
		});
		d.errback(new Error("boom"));
		d2.addErrback(function(err) {
			ok = true;
			return null;
		});
		self.assertTrue(ok);
	}
);

})(); // end anti-clobbering for JScript

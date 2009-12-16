/**
 * Tests for CW.inlineCallbacks
 */

// import CW
goog.require('cw.UnitTest');
// import CW.InlineCallbacks

cw.UnitTest.TestCase.subclass(CW.Test.TestInlineCallbacks, 'TestIC').methods(
	/**
	 * Make sure that the browser's yield actually works
	 */
	function test_yTest(self) {
		let y = CW.InlineCallbacks.yTest();
		self.assertArraysEqual([4, 8], [y.next(), y.next()]);
	},

	/**
	 * Basic test to make sure inlineCallbacks decorator works at all.
	 */
	function test_synchronous(self) {
		var result;
		var withGenerators = function() {
			yield 9;
		}
		var wrapped = CW.InlineCallbacks.inlineCallbacks(withGenerators);
		var d = wrapped();
		d.addCallback(function(r) {
			result = r;
		});
		self.assertIdentical(result, undefined);
	},

	/**
	 * Basic test to make sure returnValue works in the simplest case.
	 */
	function test_returnValue(self) {
		var result;
		var withGenerators = function() {
			// Have to yield something, because otherwise this function
			// isn't a generator.
			yield []
			CW.InlineCallbacks.returnValue(10);
		}

		var wrapped = CW.InlineCallbacks.inlineCallbacks(withGenerators);
		var d = wrapped();
		d.addCallback(function(r) {
			result = r;
		});
		self.assertIdentical(result, 10);
	},

	function test_withDeferred(self) {
		var result;
		var five;
		var withGenerators = function() {
			five = yield CW.Defer.succeed(5);
			CW.InlineCallbacks.returnValue(10);
		}
		var wrapped = CW.InlineCallbacks.inlineCallbacks(withGenerators);
		var d = wrapped();
		d.addCallback(function(r) {
			result = r;
		});
		self.assertIdentical(five, 5);
		self.assertIdentical(result, 10);
	},

	function test_withAsyncDeferred(self) {
		var five;
		function soonCallback() {
			var d = new CW.Defer.Deferred();
			setTimeout(function(){d.callback(5);}, 0);
			return d;
		}
		var withGenerators = function() {
			five = yield soonCallback();
			CW.InlineCallbacks.returnValue(10);
		}
		var wrapped = CW.InlineCallbacks.inlineCallbacks(withGenerators);
		var d = wrapped();
		d.addCallback(function(r) {
			self.assertIdentical(five, 5);
			self.assertIdentical(r, 10);
		});
		return d;
	},

	function test_withAsyncFailure(self) {
		var five;
		function soonCallback() {
			var d = new CW.Defer.Deferred();
			setTimeout(function(){d.callback(5);}, 0);
			return d;
		}
		function soonErrback() {
			var d = new CW.Defer.Deferred();
			setTimeout(function(){d.errback(new Error());}, 0);
			return d;
		}
		var withGenerators = function() {
			five = yield soonCallback();
			yield soonErrback();
			CW.InlineCallbacks.returnValue(10);
		}
		var wrapped = CW.InlineCallbacks.inlineCallbacks(withGenerators);
		var d = wrapped();
		d.addErrback(function(r) {
			self.assertIdentical(five, 5);
			self.assert(r.error instanceof Error);
		});
		return d;
	},

	function test_withSyncExceptionAfterAsyncFailure(self) {
		function soonErrback() {
			var d = new CW.Defer.Deferred();
			setTimeout(function(){d.errback(new Error());}, 0);
			return d;
		}
		var withGenerators = function() {
			try {
				yield soonErrback();
			} catch(e) {
				__asdfasdf; // ReferenceError
			}
			CW.InlineCallbacks.returnValue(10);
		}
		var wrapped = CW.InlineCallbacks.inlineCallbacks(withGenerators);
		var d = wrapped();
		d.addErrback(function(r) {
			self.assert(r.error instanceof ReferenceError);
		});
		return d;
	},

	function test_withCaughtAsyncFailure(self) {
		var five;
		var caughtIt = false;
		function soonCallback() {
			var d = new CW.Defer.Deferred();
			setTimeout(function(){d.callback(5);}, 0);
			return d;
		}
		function soonErrback() {
			var d = new CW.Defer.Deferred();
			setTimeout(function(){d.errback(new Error());}, 0);
			return d;
		}
		var withGenerators = function() {
			try {
				yield soonErrback();
			} catch(e) {
				caughtIt = true;
			}
			five = yield soonCallback();
			CW.InlineCallbacks.returnValue(10);
		}
		var wrapped = CW.InlineCallbacks.inlineCallbacks(withGenerators);
		var d = wrapped();
		d.addCallback(function(r) {
			self.assertIdentical(five, 5);
			self.assertIdentical(true, caughtIt);
			self.assertIdentical(r, 10);
		});
		return d;
	}
);

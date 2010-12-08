/* {LICENSE:Coreweb,Nevow,Twisted} */
/**
 * Tests for CW.Defer
 */


// import CW.Defer
goog.require('cw.UnitTest');

goog.require('goog.async.Deferred');


cw.UnitTest.TestCase.subclass(cw.Test.TestDeferred, 'TestFailure').methods(
	function setUp(self) {
		try {
			throw new Error("message");
		} catch (e) {
			self.failure = CW.Defer.Failure(e);
		}
	},


	/**
	 * Check that we can format a 'frame', as returned from
	 * L{Failure.parseStack}.
	 */
	function test_frameToPrettyText(self) {
		var text = self.failure.frameToPrettyText({func: 'foo',
												   fname: 'Foo/foo.js',
												   lineNumber: 82});
		self.assertIdentical(text, '  Function "foo":\n	Foo/foo.js:82');
	},



	/**
	 * Test that L{toPrettyText} returns a nicely formatted stack trace
	 * that formats frames using L{Failure.frameToPrettyText}.
	 */
	function test_toPrettyText(self) {
		if(cw.UnitTest.browserAddsCrapToErrorMessages) {
			throw new cw.UnitTest.SkipTest('Yeah, whatever, Opera.');
		}
		var frames = self.failure.parseStack();
		var text = self.failure.toPrettyText();
		var lines = text.split('\n');
		self.assertIdentical(lines[0], 'Traceback (most recent call last):');
		self.assertIdentical(lines[lines.length - 1],
							 self.failure.error.toString());
		for (var i = 0; i < frames.length; ++i) {
			var expected = self.failure.frameToPrettyText(frames[i]);
			self.assertIdentical(lines[2*i+1] + '\n' + lines[2*i+2], expected);
		}
	},


	/**
	 * Test that L{toPrettyText} uses its optional parameter as a source
	 * of frames for the pretty stack trace.
	 */
	function test_toPrettyTextOptional(self) {
		var frames = self.failure.filteredParseStack();
		var lines = self.failure.toPrettyText(frames).split('\n');
		for (var i = 0; i < frames.length; ++i) {
			var expected = self.failure.frameToPrettyText(frames[i]);
			self.assertIdentical(lines[2*i+1] + '\n' + lines[2*i+2], expected);
		};
	},


	/**
	 * Test L{filteredParseStack}, which is designed to remove the superfluous
	 * frames from the stacks.
	 */
	function test_smartParse(self) {
		var allFrames = self.failure.parseStack();
		var relevantFrames = self.failure.filteredParseStack();
		var i;

		// raises exceptions in FF2
//		var elidedFN, elidedLN, i;
//		for (i = 0; i < allFrames.length; ++i) {
//			if (allFrames[i].fname == "" && allFrames[i].lineNumber == 0) {
//				elidedFN = allFrames[i-1].fname;
//				elidedLN = allFrames[i-1].lineNumber;
//			}
//		}
		for (i = 0; i < relevantFrames.length; ++i) {
			var frame = relevantFrames[i];
			self.assertNotIdentical("", frame.fname);
			self.assertNotIdentical(0, frame.lineNumber);
			// the two asserts below are SOMETIMES(?) failing in Firefox 3 and Spidermonkey
			// (see http://divmod.org/trac/ticket/2756)
			//self.assertNotIdentical(elidedFN, frame.fname, "Found " + elidedFN);
			//self.assertNotIdentical(elidedLN, frame.lineNumber, "Found " + elidedLN);
		}
	}
);



cw.UnitTest.TestCase.subclass(cw.Test.TestDeferred, 'TestDeferred').methods(
	function test_succeedDeferred(self) {
		var result = null;
		var error = null;
		var d = CW.Defer.succeed("success");
		d.addCallback(function(res) {
			result = res;
		});
		d.addErrback(function(err) {
			error = err;
		});
		self.assertIdentical(result, 'success');
		self.assertIdentical(error, null);
	},


	function test_failDeferred(self) {
		var result = null;
		var error = null;
		var d = CW.Defer.fail(new Error("failure"));
		d.addCallback(function(res) {
			result = res;
		});
		d.addErrback(function(err) {
			error = err;
		});
		self.assertIdentical(result, null);
		self.assertErrorMessage(error.error, 'failure');
	},


	function test_callThisDontCallThat(self) {
		var thisCalled = false;
		var thatCalled = false;
		var thisCaller = function (rlst) { thisCalled = true; };
		var thatCaller = function (err) { thatCalled = true; };

		var d = new CW.Defer.Deferred();

		d.addCallbacks(thisCaller, thatCaller, [], []);
		d.callback(true);

		self.assertTrue(thisCalled);
		self.assertFalse(thatCalled);

		thisCalled = thatCalled = false;

		d = new CW.Defer.Deferred();
		d.addCallbacks(thisCaller, thatCaller, [], []);
		d.errback(new CW.Defer.Failure(Error("Test error for errback testing")));

		self.assertFalse(thisCalled);
		self.assertTrue(thatCalled);
	},


	function test_callbackResultPassedToNextCallback(self) {
		var interimResult = null;
		var finalResult = null;

		var d = new CW.Defer.Deferred();
		d.addCallback(function(result) {
			interimResult = result;
			return "final result";
		});
		d.addCallback(function(result) {
			finalResult = result;
		});
		d.callback("interim result");

		self.assertIdentical(interimResult, "interim result");
		self.assertIdentical(finalResult, "final result");
	},


	function test_addCallbacksAfterResult(self) {
		var callbackResult = null;
		var d = new CW.Defer.Deferred();
		d.callback("callback");
		d.addCallbacks(
			function(result) {
				callbackResult = result;
			}, null, [], []
		);
		self.assertIdentical(callbackResult, "callback");
	},


	function test_deferredReturnedFromCallback(self) {
		var theResult = null;
		var interimDeferred = new CW.Defer.Deferred();
		var outerDeferred = new CW.Defer.Deferred();

		outerDeferred.addCallback(
			function(ignored) {
				return interimDeferred;
			}
		);
		outerDeferred.addCallback(
			function(result) {
				theResult = result;
			}
		);

		outerDeferred.callback("callback");
		self.assertIdentical(theResult, null,
							 "theResult got value too soon: " + theResult);

		interimDeferred.callback("final result");
		self.assertIdentical(theResult, "final result",
							 "theResult did not get final result: "
							 + theResult);
	},


	function test_deferredList(self) {
		var defr1 = new CW.Defer.Deferred();
		var defr2 = new CW.Defer.Deferred();
		var defr3 = new CW.Defer.Deferred();
		var dl = new CW.Defer.DeferredList([defr1, defr2, defr3]);

		var result;
		function cb(resultList) {
			result = resultList;
		};

		dl.addCallback(cb);
		defr1.callback("1");

		// if you pass a number to new Error(stringedNumber),
		// IE will set e.message = "" and e.number = number
		var anError = new Error("some error");
		self.assertErrorMessage(anError, "some error");
		defr2.errback(anError);
		defr3.callback("3");

		self.assertIdentical(3, result.length);
		self.assertIdentical(2, result[0].length);
		self.assertIdentical(true, result[0][0]);
		self.assertIdentical("1", result[0][1]);
		self.assertIdentical(2, result[1].length);
		self.assertIdentical(false, result[1][0]);
		self.assertIdentical(true, result[1][1] instanceof CW.Defer.Failure);
		self.assertErrorMessage(result[1][1].error, "some error");
		self.assertIdentical(2, result[2].length);
		self.assertIdentical(true, result[2][0]);
		self.assertIdentical("3", result[2][1]);

		return dl;
	},


	/**
	 * L{CW.Defer.DeferredList} should fire immediately if the list of
	 * deferreds is empty.
	 */
	function test_emptyDeferredList(self) {
		var result = null;
		var dl = new CW.Defer.DeferredList([]).addCallback(function(res) {
			result = res;
		});
		self.assertTrue(result instanceof Array);
		self.assertIdentical(result.length, 0);
		return dl;
	},


	/**
	 * L{CW.Defer.DeferredList} should fire immediately if the list of
	 * deferreds is empty, even when C{fireOnOneErrback} is passed.
	 */
	function test_emptyDeferredListErrback(self) {
		var result;
		var dl = CW.Defer.DeferredList([], false, true).addCallback(
			function(theResult) {
				result = theResult;
			}
		);
		self.assertTrue(result instanceof Array);
		self.assertIdentical(result.length, 0);
		return dl;
	},


	function test_fireOnOneCallback(self) {
		var result = null;
		var dl = new CW.Defer.DeferredList(
			[new CW.Defer.Deferred(), CW.Defer.succeed("success")],
			true, false, false);
		dl.addCallback(function(res) {
			result = res;
		});
		self.assertTrue(result instanceof Array);
		self.assertArraysEqual(result, ['success', 1]);
		return dl;
	},


	function test_fireOnOneErrback(self) {
		var result = null;
		var dl = new CW.Defer.DeferredList(
			[new CW.Defer.Deferred(),
			 CW.Defer.fail(new Error("failure"))], false, true, false);
		dl.addErrback(function(err) {
			result = err;
		});
		self.assertTrue(result instanceof CW.Defer.Failure);
		self.assertTrue(result.error instanceof CW.Defer.FirstError);
		return dl;
	},


	function test_gatherResults(self) {
		var result = null;
		var dl = CW.Defer.gatherResults(
			[CW.Defer.succeed("1"), CW.Defer.succeed("2")]);
		dl.addCallback(function(res) {
			result = res;
		});
		self.assertTrue(result instanceof Array);
		self.assertArraysEqual(result, ['1', '2']);
		return dl;
	},

	/* There was a bit of copy/paste going on here. */

	/**
	 * The result and argument list should get passed in properly
	 * when using addCallback.
	 */
	function test_addCallbackArguments1(self) {
		var d = CW.Defer.Deferred();
		var callbackArgs = [];
		var callback = function(result, arg1) {
			callbackArgs.push.apply(callbackArgs, arguments);
		}
		d.addCallback(callback, 20);
		d.callback(10);

		self.assertArraysEqual(callbackArgs, [10, 20]);
		return d;
	},


	/**
	 * The result and argument list should get passed in properly
	 * when using addCallback.
	 */
	function test_addCallbackArguments3(self) {
		var d = CW.Defer.Deferred();
		var callbackArgs = [];
		var callback = function(result, arg1, arg2, arg3) {
			callbackArgs.push.apply(callbackArgs, arguments);
		}
		d.addCallback(callback, 20, 30, 40);
		d.callback(10);
		self.assertArraysEqual(callbackArgs, [10, 20, 30, 40]);
		return d;
	},

	/* -- */

	/**
	 * The result and argument list should get passed in properly
	 * when using addErrback.
	 */
	function test_addErrbackArguments1(self) {
		var d = CW.Defer.Deferred();
		var callbackArgs = [];
		var callback = function(ignored, arg1) {
			callbackArgs.push.apply(callbackArgs, arguments);
			callbackArgs.shift();
		}
		d.addErrback(callback, 20);
		d.errback(new Error("boom"));
		self.assertArraysEqual(callbackArgs, [20]);
		return d;
	},


	/**
	 * The result and argument list should get passed in properly
	 * when using addErrback.
	 */
	function test_addErrbackArguments3(self) {
		var d = CW.Defer.Deferred();
		var callbackArgs = [];
		var callback = function(ignored, arg1, arg2, arg3) {
			callbackArgs.push.apply(callbackArgs, arguments);
			callbackArgs.shift();
		}
		d.addErrback(callback, 20, 30, 40);
		d.errback(new Error("boom"));
		self.assertArraysEqual(callbackArgs, [20, 30, 40]);
		return d;
	},

	/* -- */

	/**
	 * The result and argument list should get passed in properly
	 * when using addBoth.
	 */
	function test_addBothArguments1(self) {
		var d = CW.Defer.Deferred();
		var callbackArgs = [];
		var callback = function(result, arg1) {
			callbackArgs.push.apply(callbackArgs, arguments);
		}
		d.addCallback(callback, 20);
		d.callback(10);

		self.assertArraysEqual(callbackArgs, [10, 20]);
		return d;
	},


	/**
	 * The result and argument list should get passed in properly
	 * when using addBoth.
	 */
	function test_addBothArguments3(self) {
		var d = CW.Defer.Deferred();
		var callbackArgs = [];
		var callback = function(result, arg1, arg2, arg3) {
			callbackArgs.push.apply(callbackArgs, arguments);
		}
		d.addBoth(callback, 20, 30, 40);
		d.callback(10);
		self.assertArraysEqual(callbackArgs, [10, 20, 30, 40]);
		return d;
	},


	/**
	 * Confirm a limitation of the Deferred implementation, where there are problems
	 * passing in the same argument array for multiple callbacks/errbacks.
	 */
	function test_addCallbacksCannotReuseArray(self) {
		var d = CW.Defer.Deferred();
		var errbackArgs1 = [];
		var errbackArgs2 = [];

		var errback1 = function(theError, arg1, arg2, arg3) {
			errbackArgs1.push.apply(errbackArgs1, arguments);
			errbackArgs1.shift();
			return theError;
		}

		var errback2 = function(theError, arg1, arg2, arg3) {
			errbackArgs2.push.apply(errbackArgs2, arguments);
			errbackArgs2.shift();
			return theError;
		}

		// Use the same object for everything
		var args = [20, 30, 40];
		d.addCallbacks(function() {}, errback1, args, args);
		d.addCallbacks(null, errback2, [], args); // errback and args

		d.errback(new Error("boom"));

		self.assertArraysEqual(errbackArgs1, [20, 30, 40]);
		// problems begin!
		self.assertArraysNotEqual(errbackArgs2, [20, 30, 40]);
	},


	/**
	 * Confirm that it works fine when the array is not reused.
	 * (see comment for test L{test_addCallbacksCannotReuseArray})
	 */
	function test_addCallbacksCanReuseWithDifferentArray(self) {
		var d = CW.Defer.Deferred();
		var errbackArgs1 = [];
		var errbackArgs2 = [];

		var errback1 = function(theError, arg1, arg2, arg3) {
			errbackArgs1.push.apply(errbackArgs1, arguments);
			errbackArgs1.shift();
			return theError;
		}

		var errback2 = function(theError, arg1, arg2, arg3) {
			errbackArgs2.push.apply(errbackArgs2, arguments);
			errbackArgs2.shift();
			return theError;
		}

		// Use the same object for everything
		var args = [20, 30, 40];
		d.addCallbacks(function() {}, errback1, args, args);
		d.addCallbacks(null, errback2, [], [20, 30, 40]); // errback and args

		d.errback(new Error("boom"));

		self.assertArraysEqual(errbackArgs1, [20, 30, 40]);
		self.assertArraysEqual(errbackArgs2, [20, 30, 40]);

		return d;
	}
);



// These tests copied from twisted.test.test_defer

cw.UnitTest.TestCase.subclass(cw.Test.TestDeferred, 'MaybeDeferredTests').methods(
	/**
	 * L{maybeDeferred} should retrieve the result of a synchronous
	 * function and pass it to its resulting L{Deferred}.
	 */
	function test_maybeDeferredSync(self) {
		var S = [], E = [];
		var d = CW.Defer.maybeDeferred(function(x) { return x + 5 }, [10]);
		d.addCallbacks(function(s){S.push(s)}, function(err){E.push(err)}, [], []);
		self.assertEqual(E, []);
		self.assertEqual(S, [15]);
		return d;
	},

	/**
	 * LmaybeDeferred} should catch exception raised by a synchronous
	 * function and errback its resulting L{Deferred} with it.
	 */
	function test_maybeDeferredSyncError(self) {
		var S = [], E = [];
		try {
			throw new Error("boom");
		} catch(e) {
			var saved = e;
		}
		var d = CW.Defer.maybeDeferred(function() { throw new Error("boom"); });
		d.addCallbacks(function(s){S.push(s)}, function(err){E.push(err)}, [], []);
		self.assertEqual(S, []);
		self.assertEqual(E.length, 1);
		self.assertErrorMessage(saved, "boom");
		return d;
	},

	/**
	 * L{maybeDeferred} should let L{Deferred} instance pass by
	 * so that original result is the same.
	 */
	function test_maybeDeferredAsync(self) {
		var d = CW.Defer.Deferred();
		var d2 = CW.Defer.maybeDeferred(function() { return d; });
		d.callback('Success');
		return d2.addCallback(function(s){self.assertEqual(s, 'Success')});
	},

	/**
	 * L{maybeDeferred} should let L{Deferred} instance pass by
	 * so that L{Failure} returned by the original instance is the
	 * same.
	 */
	function test_maybeDeferredAsyncError(self) {
		throw new cw.UnitTest.SkipTest('No longer works because assertFailure assumes goog.async.Deferred addCallbacks takes 2-3 args, not 4');
		
		var d = CW.Defer.Deferred();
		var d2 = CW.Defer.maybeDeferred(function() {return d});
		d.errback(CW.Defer.Failure(new Error()));
		return self.assertFailure(d2, [Error]);
	}

//	/**
//	 * L{maybeDeferred} translates L{goog.async.Deferred}s to L{CW.Defer.Deferred}. Callbacks work.
//	 */
//	 function test_deferredTranslationCallback(self) {
//	      var oldD = new goog.async.Deferred();
//	      var oldDFunc = function() { return oldD; }
//		var newD = CW.Defer.maybeDeferred(oldDFunc);
//		self.assertTrue(newD instanceof CW.Defer.Deferred);
//		var expected = 3;
//		function cb(result) {
//			self.assertEqual(expected, result);
//		}
//		newD.addCallback(cb)
//		oldD.callback(expected);
//		return newD;
//	 },
//
//	 /**
//	 * L{maybeDeferred} translates L{goog.async.Deferred}s to L{CW.Defer.Deferred}. Errbacks work.
//	 */
//	 function test_deferredTranslationErrback(self) {
//	      var oldD = new goog.async.Deferred();
//	      var oldDFunc = function() { return oldD; }
//		var newD = CW.Defer.maybeDeferred(oldDFunc);
//		self.assertTrue(newD instanceof CW.Defer.Deferred);
//		var expected = new Error("boom");
//		function eb(failure) {
//			self.assertEqual(expected, failure.error);
//		}
//		newD.addErrback(eb)
//		oldD.errback(expected);
//		return newD;
//	 },
//
//
//	 /**
//	 * L{maybeDeferred} translates L{goog.async.Deferred}s to L{CW.Defer.Deferred}. Errbacks work, even for L{CW.Error}s.
//	 */
//	 function test_deferredTranslationErrbackCWError(self) {
//	      var oldD = new goog.async.Deferred();
//	      var oldDFunc = function() { return oldD; }
//		var newD = CW.Defer.maybeDeferred(oldDFunc);
//		self.assertTrue(newD instanceof CW.Defer.Deferred);
//		var expected = new CW.Error("boom");
//		function eb(failure) {
//			self.assertEqual(expected, failure.error);
//		}
//		newD.addErrback(eb)
//		oldD.errback(expected);
//		return newD;
//	 }
);

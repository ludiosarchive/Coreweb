/**
 * Tests for CW.Defer
 */


// import CW.Defer
// import CW.UnitTest


CW.UnitTest.TestCase.subclass(CW.Test.TestDeferred, 'TestFailure').methods(
	function setUp(self) {
		try {
			throw CW.Error("message");
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
		if(CW.window.opera && CW.window.opera.version() >= 10) {
			print("{SKIPPING} test_toPrettyText because of Opera 10.<br>");
			return;
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



CW.UnitTest.TestCase.subclass(CW.Test.TestDeferred, 'TestDeferred').methods(
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
		var d = CW.Defer.fail(Error("failure"));
		d.addCallback(function(res) {
			result = res;
		});
		d.addErrback(function(err) {
			error = err;
		});
		self.assertIdentical(result, null);
		self.assertIdentical(error.error.message, 'failure');
	},


	function test_callThisDontCallThat(self) {
		var thisCalled = false;
		var thatCalled = false;
		var thisCaller = function (rlst) { thisCalled = true; };
		var thatCaller = function (err) { thatCalled = true; };

		var d = new CW.Defer.Deferred();

		d.addCallbacks(thisCaller, thatCaller);
		d.callback(true);

		self.assert(thisCalled);
		self.assert(!thatCalled);

		thisCalled = thatCalled = false;

		d = new CW.Defer.Deferred();
		d.addCallbacks(thisCaller, thatCaller);
		d.errback(new CW.Defer.Failure(Error("Test error for errback testing")));

		self.assert(!thisCalled);
		self.assert(thatCalled);
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
			}
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
		var anError = new Error("Must be uncastable to num for IE.");
		self.assertIdentical("Must be uncastable to num for IE.", anError.message);
		defr2.errback(anError);
		defr3.callback("3");

		self.assertIdentical(3, result.length);
		self.assertIdentical(2, result[0].length);
		self.assertIdentical(true, result[0][0]);
		self.assertIdentical("1", result[0][1]);
		self.assertIdentical(2, result[1].length);
		self.assertIdentical(false, result[1][0]);
		self.assertIdentical(true, result[1][1] instanceof CW.Defer.Failure);
		self.assertIdentical("Must be uncastable to num for IE.", result[1][1].error.message);
		self.assertIdentical(2, result[2].length);
		self.assertIdentical(true, result[2][0]);
		self.assertIdentical("3", result[2][1]);
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
		self.assert(result instanceof Array);
		self.assertIdentical(result.length, 0);
	},


	/**
	 * L{CW.Defer.DeferredList} should fire immediately if the list of
	 * deferreds is empty, even when C{fireOnOneErrback} is passed.
	 */
	function test_emptyDeferredListErrback(self) {
		var result;
		CW.Defer.DeferredList([], false, true).addCallback(
			function(theResult) {
				result = theResult;
			}
		);
		self.assert(result instanceof Array);
		self.assertIdentical(result.length, 0);
	},


	function test_fireOnOneCallback(self) {
		var result = null;
		var dl = new CW.Defer.DeferredList(
			[new CW.Defer.Deferred(), CW.Defer.succeed("success")],
			true, false, false);
		dl.addCallback(function(res) {
			result = res;
		});
		self.assert(result instanceof Array);
		self.assertArraysEqual(result, ['success', 1]);
	},


	function test_fireOnOneErrback(self) {
		var result = null;
		var dl = new CW.Defer.DeferredList(
			[new CW.Defer.Deferred(),
			 CW.Defer.fail(new Error("failure"))],
			false, true, false);
		dl.addErrback(function(err) {
			result = err;
		});
		self.assert(result instanceof CW.Defer.Failure);
		self.assert(result.error instanceof CW.Defer.FirstError);
	},


	function test_gatherResults(self) {
		var result = null;
		var dl = CW.Defer.gatherResults([CW.Defer.succeed("1"),
											 CW.Defer.succeed("2")]);
		dl.addCallback(function(res) {
			result = res;
		});
		self.assert(result instanceof Array);
		self.assertArraysEqual(result, ['1', '2']);
	}
);

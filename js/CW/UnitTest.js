/**
 * JavaScript unit testing framework, modeled on xUnit.
 *
 * Heavy modified from the Divmod UnitTest.js to add support
 * for Deferreds in test methods, setUp, and tearDown.
 */


// import CW
// import CW.Defer
// import CW.Inspect


/**
 * Return a suite which contains every test defined in C{testClass}. Assumes
 * that if a method name starts with C{test_}, then it is a test.
 */
CW.UnitTest.loadFromClass = function loadFromClass(testClass) {
	var prefix = 'test_';
	var suite = CW.UnitTest.TestSuite();
	var methods = CW.Inspect.methods(testClass);
	for (var i = 0; i < methods.length; ++i) {
		var name = methods[i];
		if (CW.startswith(name, prefix)) {
			suite.addTest(testClass(name));
		}
	}
	return suite;
};


/**
 * Return C{true} is given value is a subclass of L{CW.UnitTest.TestCase},
 * C{false} otherwise.
 */
CW.UnitTest.isTestCaseClass = function isTestCaseClass(klass) {
	if (klass.subclassOf === undefined) {
		return false;
	}
	return klass.subclassOf(CW.UnitTest.TestCase);
};


/**
 * Return a suite which contains every test defined in C{testModule}.
 */
CW.UnitTest.loadFromModule = function loadFromModule(testModule) {
	var suite = CW.UnitTest.TestSuite();
	for (var name in testModule) {
		if (CW.UnitTest.isTestCaseClass(testModule[name])) {
			suite.addTest(CW.UnitTest.loadFromClass(testModule[name]));
		}
	}
	return suite;
};



/**
 * Return a suite which contains every test in every module in array C{testModules}.
 */
CW.UnitTest.loadFromModules = function loadFromModule(testModules) {
	var suite = CW.UnitTest.TestSuite();
	for (var i in testModules) {
		var testModule = testModules[i];
		for (var name in testModule) {
			if (CW.UnitTest.isTestCaseClass(testModule[name])) {
				suite.addTest(CW.UnitTest.loadFromClass(testModule[name]));
			}
		}
	}
	return suite;
};



/**
 * Raised to indicate that a test has failed.
 */
CW.Error.subclass(CW.UnitTest, 'AssertionError').methods(
	function toString(self) {
		return 'AssertionError: ' + self.getMessage();
	}
);



/**
 * Raised to indicate that a test is being skipped.
 */
CW.Error.subclass(CW.UnitTest, 'SkipTest').methods(
	function toString(self) {
		return 'SkipTest: ' + self.getMessage();
	}
);



/**
 * Represents the results of a run of unit tests.
 *
 * @type testsRun: integer
 * @ivar testsRun: The number of tests that have been run using this as the
 *				 result.
 *
 * @type failures: Array of [L{TestCase}, L{CW.Error}] pairs
 * @ivar failures: The assertion failures that have occurred in this test run,
 *				 paired with the tests that generated them.
 *
 * @type successes: Array of L{TestCase}
 * @ivar successes: A list of tests that succeeded.
 *
 * @type errors: Array of [L{TestCase}, L{CW.Error}] pairs
 * @ivar errors: The errors that were raised by tests in this test run, paired
 *			   with the tests that generated them.
 */
CW.UnitTest.TestResult = CW.Class.subclass('CW.UnitTest.TestResult');
CW.UnitTest.TestResult.methods(
	function __init__(self) {
		self.testsRun = 0;
		self.failures = [];
		self.successes = [];
		self.errors = [];
		self.skips = [];
		self.timeStarted = null;
	},


	/**
	 * Called by C{TestCase.run} at the start of the test.
	 *
	 * @param test: The test that just started.
	 * @type test: L{CW.UnitTest.TestCase}
	 */
	function startTest(self, test) {
		if(self.timeStarted === null) {
			self.timeStarted = new Date().getTime();
		}
		self.testsRun++;
	},


	/**
	 * Called by C{TestCase.run} at the end of the test run.
	 *
	 * @param test: The test that just finished.
	 * @type test: L{CW.UnitTest.TestCase}
	 */
	function stopTest(self, test) {
	},


	/**
	 * Report an error that occurred while running the given test.
	 *
	 * @param test: The test that had an error.
	 * @type test: L{CW.UnitTest.TestCase}
	 *
	 * @param error: The error that occurred.
	 * @type error: Generally a L{CW.Defer.Failure} wrapping a L{CW.Error} instance.
	 */
	function addError(self, test, error) {
		self.errors.push([test, error]);
	},


	/**
	 * Report a failed assertion that occurred while running the given test.
	 *
	 * This is unrelated to Failure objects.
	 *
	 * @param test: The test with the failed assertion.
	 * @type test: L{CW.UnitTest.TestCase}
	 *
	 * @param failure: The failure that occurred.
	 * @type failure: A L{CW.Defer.Failure} wrapping a L{CW.UnitTest.AssertionError} instance.
	 */
	function addFailure(self, test, failure) {
		self.failures.push([test, failure]);
	},


	/**
	 * Report a skipped test.
	 *
	 * @param test: The test that was skipped.
	 * @type test: L{CW.UnitTest.TestCase}
	 *
	 * @param failure: The failure that occurred.
	 * @type failure: A L{CW.Defer.Failure} wrapping a L{CW.UnitTest.SkipTest} instance.
	 */
	function addSkip(self, test, skip) {
		self.skips.push([test, skip]);
	},


	/**
	 * Report that the given test succeeded.
	 *
	 * @param test: The test that succeeded.
	 * @type test: L{CW.UnitTest.TestCase}
	 */
	function addSuccess(self, test) {
		self.successes.push(test);
	},


	/**
	 * Return a triple of (tests run, number of failures, number of errors)
	 */
	function getSummary(self) {
		return [self.testsRun, self.failures.length, self.errors.length, self.skips.length];
	},


	/**
	 * Return C{true} if there have been no failures or errors. Return C{false}
	 * if there have been.
	 */
	function wasSuccessful(self) {
		return self.failures.length == 0 && self.errors.length == 0;
	}
);


/**
 * Adds test results to a div, as they are run.
 */
CW.UnitTest.DIVTestResult = CW.UnitTest.TestResult.subclass('CW.UnitTest.DIVTestResult');
CW.UnitTest.DIVTestResult.methods(
	function __init__(self, div) {
		CW.UnitTest.DIVTestResult.upcall(self, '__init__', []);
		self._div = div;
	},


	function startTest(self, test) {
		CW.UnitTest.DIVTestResult.upcall(self, 'startTest', [test]);
		var textnode = document.createTextNode(test.id());
		self._div.appendChild(textnode);
	},


	function addError(self, test, error) {
		CW.UnitTest.DIVTestResult.upcall(self, 'addError', [test, error]);
		var br = document.createElement("br");
		var textnode = document.createTextNode('... ERROR');
		var pre = document.createElement("pre");
		pre.innerHTML = error.toString();
		self._div.appendChild(textnode);
		self._div.appendChild(br);
		self._div.appendChild(pre);
	},


	function addFailure(self, test, failure) {
		CW.UnitTest.DIVTestResult.upcall(self, 'addFailure', [test, failure]);
		var br = document.createElement("br");
		var textnode = document.createTextNode('... FAILURE');
		var pre = document.createElement("pre");
		pre.innerHTML = failure.toString();
		self._div.appendChild(textnode);
		self._div.appendChild(br);
		self._div.appendChild(pre);
		//self._div.appendChild(failure.toPrettyNode());
	},


	function addSkip(self, test, failure) {
		CW.UnitTest.DIVTestResult.upcall(self, 'addSkip', [test, failure]);
		var br = document.createElement("br");
		var textnode = document.createTextNode('... SKIP');
		var pre = document.createElement("pre");
		pre.innerHTML = failure.toString();
		self._div.appendChild(textnode);
		self._div.appendChild(br);
		self._div.appendChild(pre);
		//self._div.appendChild(failure.toPrettyNode());
	},


	function addSuccess(self, test) {
		CW.UnitTest.DIVTestResult.upcall(self, 'addSuccess', [test]);
		var br = document.createElement("br");
		var textnode = document.createTextNode('... OK');
		self._div.appendChild(textnode);
		self._div.appendChild(br);
	}
);


// no more subunit/spidermonkey
/*
CW.UnitTest.SubunitTestClient = CW.UnitTest.TestResult.subclass('CW.UnitTest.SubunitTestClient');
CW.UnitTest.SubunitTestClient.methods(
	function _write(self, string) {
		print(string);
	},

	function _sendException(self, f) {
		self._write(f.toPrettyText(f.filteredParseStack()));
	},

	function addError(self, test, error) {
		self._write("error: " + test.id() + " [");
		self._sendException(error);
		self._write(']');
	},

	function addFailure(self, test, failure) {
		self._write("failure: " + test.id() + " [");
		self._sendException(failure);
		self._write(']');
	},

	// TODO: needs addSkip is re-enabled

	function addSuccess(self, test) {
		self._write('successful: ' + test.id());
	},

	function startTest(self, test) {
		self._write('test: ' + test.id());
	});
*/


/**
 * Represents a collection of tests. Implements the Composite pattern.
 */
CW.UnitTest.TestSuite = CW.Class.subclass('CW.UnitTest.TestSuite');
CW.UnitTest.TestSuite.methods(
	function __init__(self, /* optional */ tests) {
		self.tests = [];
		if (tests != undefined) {
			self.addTests(tests);
		}
	},


	/**
	 * Add the given test to the suite.
	 *
	 * @param test: The test to add.
	 * @type test: L{CW.UnitTest.TestCase} or L{CW.UnitTest.TestSuite}
	 */
	function addTest(self, test) {
		self.tests.push(test);
	},


	/**
	 * Add the given tests to the suite.
	 *
	 * @param tests: An array of tests to add.
	 * @type tests: [L{CW.UnitTest.TestCase} or L{CW.UnitTest.TestSuite}]
	 */
	function addTests(self, tests) {
		for (var i = 0; i < tests.length; ++i) {
			self.addTest(tests[i]);
		}
	},


	/**
	 * Return the number of actual tests contained in this suite.
	 *
	 * Nothing appears to actually use countTestCases except for the unit tests for it.
	 */
	function countTestCases(self) {
		var total = 0;
		var visitor = function (test) { total += test.countTestCases(); };

		var countVisitor = CW.UnitTest.SynchronousVisitor();
		countVisitor.traverse(visitor, self.tests);

		return total;
	},


	/**
	 * Visit each test case in this suite with the given visitor function.
	 */
	function visit(self, visitor) {
		// safari has serious maximum recursion problems
		var sVisitor = CW.UnitTest.SerialVisitor(); // or ConcurrentVisitor
		return sVisitor.traverse(visitor, self.tests);
	},


	/**
	 * Visit each test case in this suite with the given visitor function *synchronously*,
	 * ignoring any Deferreds.
	 *
	 * Useful for counting the # of tests and not much else.
	 */
	function visitSync(self, visitor) {
		var testVisitor = CW.UnitTest.SynchronousVisitor();
		testVisitor.traverse(visitor, self.tests);
	},



	/**
	 * Run all of the tests in the suite.
	 */
	function run(self, result) {
		var installD = CW.UnitTest.installMonkeys();

		installD.addCallback(function(){
			var d = self.visit(function (test) { return test.run(result); });

			/**
			 * Possibly make it easier to figure out when IE is leaking memory.
			 * Not really needed, especially because sIEve does this for us on the blank page.
			 */
			d.addBoth(function(){
				if (typeof CollectGarbage != 'undefined') {
					CollectGarbage();
				}
			});
			return d;
		});
		installD.addErrback(CW.err);
		return installD;
	});



/**
 * I represent a single unit test. Subclass me for your own tests.
 *
 * I will be instantiated once per your own test_ method, by L{CW.UnitTest.loadFromClass}.
 *
 * I know which asserts/compares are "internal" (called by my own logic) because:
 * some browsers don't have tracebacks in JS,
 * and user wants to know which assert/compare statement in the TestCase failed.
 *
 * To do this tracking, I assert the statement,
 * then increment the counter if the assert came directly
 * from the user's test_ method (and not of my own methods).
 */


CW.UnitTest.TestCase = CW.Class.subclass('CW.UnitTest.TestCase');
CW.UnitTest.TestCase.methods(
	/**
	 * Construct a test.
	 *
	 * @type methodName: string
	 * @param methodName: The name of a method on this object that contains
	 * the unit test.
	 */
	function __init__(self, methodName) {
		self._methodName = methodName;
		self._assertCounter = 0;
	},


	/**
	 * Return a string which identifies this test.
	 */
	function id(self) {
		return self.__class__.__name__ + '.' + self._methodName;
	},


	/**
	 * Count the number of test cases in this test. Always 1, because an
	 * instance represents a single test.
	 */
	function countTestCases(self) {
		return 1; /* get this only with SynchronousTestVisitor */
	},


	/**
	 * Visit this test case.
	 *
	 * @param visitor: A callable which takes one argument (a test case).
	 */
	function visit(self, visitor) {
		//return CW.Defer.succeed(visitor(self));
		return visitor(self);
	},


	function visitSync(self, visitor) {
		visitor(self);
	},


	/**
	 * Fail the test. Equivalent to an invalid assertion.
	 *
	 * @type reason: text
	 * @param reason: Why the test is being failed.
	 * @throw: CW.UnitTest.AssertionError
	 */
	function fail(self, reason) {
		throw self.getFailError(reason);
	},


	/**
	 * Get the right AssertionError. Direct use is useful for testing UnitTest and errbacks.
	 *
	 * @type reason: text
	 * @param reason: Why the test is being failed.
	 * @throw: CW.UnitTest.AssertionError
	 */
	function getFailError(self, reason) {
		return CW.UnitTest.AssertionError("[" + self._assertCounter + "] " + reason);
	},


	/**
	 * Assert that the given expression evalutates to true.
	 *
	 * @type expression: boolean
	 * @param expression: The thing we are asserting.
	 *
	 * @type message: text
	 * @param message: An optional parameter, explaining what the assertion
	 * means.
	 */
	function assert(self, expression, /* optional */ message, internalAssert /*=false*/) {
		if (!expression) {
			self.fail(message);
		}
		if(internalAssert !== true) {
			self._assertCounter += 1;
		}
	},


	/**
	 * Compare C{a} and C{b} using the provided predicate.
	 *
	 * @type predicate: A callable that accepts two parameters.
	 * @param predicate: Returns either C{true} or C{false}.
	 *
	 * @type description: text
	 * @param description: Describes the inverse of the comparison. This is
	 *					 used in the L{AssertionError} if the comparison
	 *					 fails.
	 *
	 * @type a: any
	 * @param a: The thing to be compared with C{b}. Passed as the first
	 *		   parameter to C{predicate}.
	 *
	 * @type b: any
	 * @param b: The thing to be compared with C{a}. Passed as the second
	 *		   parameter to C{predicate}.
	 *
	 * @type message: text
	 * @param message: An optional message to be included in the raised
	 *				 L{AssertionError}.
	 *
	 * @raises L{CW.UnitTest.AssertionError} if C{predicate} returns
	 * C{false}.
	 */
	function compare(self, predicate, description, a, b,
					 /* optional */ message, internalCompare /*=false*/) {
		var repr = CW.UnitTest.repr;
		if (!predicate(a, b)) {
			var msg = repr(a) + " " + description + " " + repr(b);
			if (message != null) {
				msg += ': ' + message;
			}
			self.fail(msg);
		}
		if(internalCompare !== true) {
			self._assertCounter += 1;
		}
	},


	/**
	 * Assert that Arrays C{a} and C{b} are equal.
	 * Uses a shallow comparison of items, strict equality.
	 */
	function assertArraysEqual(self, a, b, /* optional */ message) {
		self.compare(CW.arraysEqual, '<font color="red">not array-equal to</font>', a, b, message, true);
		self._assertCounter += 1;
	},


	/**
	 * Assert that Arrays C{a} and C{b} are not equal.
	 * Uses a shallow comparison of items, strict equality.
	 */
	function assertArraysNotEqual(self, a, b, /* optional */ message) {
		var invert = function(func) {
			return function(){
				return !func.apply(this, arguments);
			};
		};
		var arraysNotEqual = invert(CW.arraysEqual);
		self.compare(arraysNotEqual, '<font color="red">array-equal to</font>', a, b, message, true);
		self._assertCounter += 1;
	},


	/**
	 * Assert that C{a} and C{b} are identical.
	 */
	function assertIdentical(self, a, b, /* optional */ message) {
		self.compare(function (x, y) { return x === y; },
					 '<font color="red">not ===</font>', a, b, message, true);
		self._assertCounter += 1;
	},


	/**
	 * Assert that C{a} and C{b} are NOT identical.
	 */
	function assertNotIdentical(self, a, b, /* optional */ message) {
		self.compare(function (x, y) { return !(x === y); },
					 '<font color="red">===</font>', a, b, message, true);
		self._assertCounter += 1;
	},


	/**
	 * Assert that C{callable} throws C{expectedError}
	 *
	 * @param expectedError: The error type (class or prototype) which is
	 * expected to be thrown.
	 *
	 * @param callable: A no-argument callable which is expected to throw
	 * C{expectedError}.
	 *
	 * @param expectedMessage: The message which the error is expected
	 * to have. If you pass this argument, the C{expectedError}
	 * must be of type L{CW.Error} or a subclass of it.
	 *
	 * @throw AssertionError: Thrown if the callable doesn't throw
	 * C{expectedError}. This could be because it threw a different error or
	 * because it didn't throw any errors.
	 *
	 * @return: The exception that was raised by callable.
	 */
	function assertThrows(self, expectedError, callable, expectedMessage /*optional*/) {
		var threw = null;
		try {
			callable();
		} catch (e) {
			threw = e;
			self.assert(e instanceof expectedError,
						"Wrong error type thrown: " + e, true);
			if(expectedMessage !== undefined) {
				self.assertIdentical(
					e.getMessage(), expectedMessage,
					"Error started with wrong message: " + e.getMessage(), true);
			}
		}
		self.assert(threw != null, "Callable threw no error", true);
		self._assertCounter += 1;
		return threw;
	},



	/**
	 *
	 * assertFailure was copy/pasted from Nevow.Athena.Test:
	 *
	 * Add a callback and an errback to the given Deferred which will assert
	 * that it is errbacked with one of the specified error types.
	 *
	 * This "Failure" has to do with the "Failure" objects, not the assert failures.
	 *
	 * @param deferred: The L{CW.Defer.Deferred} which is expected to fail.
	 *
	 * @param errorTypes: An C{Array} of L{CW.Error} subclasses which are
	 * the allowed failure types for the given Deferred.
	 *
	 * @throw Error: Thrown if C{errorTypes} has a length of 0.
	 *
	 * @rtype: L{CW.Defer.Deferred}
	 *
	 * @return: A Deferred which will fire with the error instance with which
	 * the input Deferred fails if it is one of the types specified in
	 * C{errorTypes} or which will errback if the input Deferred either
	 * succeeds or fails with a different error type.
	 */
	function assertFailure(self, deferred, errorTypes) {
		if (errorTypes.length == 0) {
			throw new Error("Specify at least one error class to assertFailure");
		}
		return deferred.addCallbacks(
			function(result) {
				self.fail("Deferred reached callback; expected an errback.");
			},
			function(err) {
				var result;
				for (var i = 0; i < errorTypes.length; ++i) {
					result = err.check(errorTypes[i]);
					if (result != null) {
						return result;
					}
				}
				self.fail("Expected " + errorTypes + ", got " + err);
			},
			[], []
		);
	},



	/**
	 * Override me to provide code to set up a unit test. This method is called
	 * before the test method.
	 *
	 * L{setUp} is most useful when a subclass contains many test methods which
	 * require a common base configuration. L{tearDown} is the complement of
	 * L{setUp}.
	 */
	function setUp(self) {
	},


	/**
	 * Override me to provide code to clean up a unit test. This method is called
	 * after the test method.
	 *
	 * L{tearDown} is at its most useful when used to clean up resources that are
	 * initialized/modified by L{setUp} or by the test method.
	 */
	function tearDown(self) {
	},


	function _maybeWrapWithDeferred(self, aFunction) {

		/* Trying to "improve" the logic here is futile. Think about the catch() {} placement. Resist. */

		var oneDeferredOrResult; // or Failure
		var immediatelyFailed;
		try {
			immediatelyFailed = false;
			oneDeferredOrResult = aFunction();
		} catch (err) { // this checks for immediate (synchronous) failures only. what() could still fail later.
			immediatelyFailed = true;
			oneDeferredOrResult = CW.Defer.fail(err);
		}


		if (!immediatelyFailed) {
			if (!(oneDeferredOrResult instanceof CW.Defer.Deferred)) {
				oneDeferredOrResult = CW.Defer.succeed(oneDeferredOrResult);
			}
		}

		return oneDeferredOrResult;

	},


	/**
	 * Actually run this test.
	 */
	function run(self, result) {
		var success = true;
		var setUpD, methodD, tearDownD;

		CW.msg('Starting ' + self + ' ' + self._methodName);

		result.startTest(self);

		setUpD = self._maybeWrapWithDeferred(function(){return self.setUp();});

		setUpD.addCallbacks(
			/* callback */
			function(){

				methodD = self._maybeWrapWithDeferred(function(){return self[self._methodName]();});

				//console.log("From " + self._methodName + " got a ", methodD);

				methodD.addErrback(function(aFailure) {
					// Note that we're not adding the Error as Divmod did; we are adding the Failure
					if (aFailure.error instanceof CW.UnitTest.AssertionError) {
						result.addFailure(self, aFailure);
					} else if (aFailure.error instanceof CW.UnitTest.SkipTest) {
						result.addSkip(self, aFailure);
					} else {
						result.addError(self, aFailure);
					}
					success = false;
				});

				// even if the test_ method fails, we must run tearDown.
				methodD.addBoth(function(){

					// for some debugging, prepend the closure with
					// console.log("in teardown after", self._methodName);

					tearDownD = self._maybeWrapWithDeferred(function(){return self.tearDown();});

					// approaching the end of our journey

					tearDownD.addErrback(function(aFailure) {
						// this *could* be the second error we add,
						// because the method itself could have also produced a failure/error.
						result.addError(self, aFailure);
						success = false;
					});

					tearDownD.addBoth(function(){
						if (success) {
							var whichProblems = [];
							for(var pendingType in CW.UnitTest.delayedCalls) {
								for(var ticket in CW.UnitTest.delayedCalls[pendingType]) {
									whichProblems.push(pendingType);
								}
							}

							if(whichProblems.length > 0) {
								success = false;

								result.addError(self,
									new CW.Defer.Failure(
										new CW.Error(
											"Test ended with " + whichProblems.length +
											" pending call(s): " + whichProblems)));

								// Cleanup everything. If we don't do this, test output is impossible
								// to decipher, because delayed calls "spill over" to future tests.
								CW.UnitTest.stopTrackingDelayedCalls();
							}

							if(success) {
								result.addSuccess(self);
							}
						}

						result.stopTest(self);
					});

					return tearDownD;

				});

				return methodD;

			},

			/* errback */
			function(aFailure){
				if (aFailure.error instanceof CW.UnitTest.SkipTest) {
					result.addSkip(self, aFailure);
				} else {
					result.addError(self, aFailure);
				}
			},

			[], []

		);

		return setUpD;

	}


//   Reference Deferred-free implementation from original Divmod UnitTest.js
//
//	/**
//	 * Actually run this test.
//	 */
//	function run(self, result) {
//		var success = true;
//		result.startTest(self);
//
//		// XXX: This probably isn't the best place to put this, but it's the
//		// only place for the time being; see #2806 for the proper way to deal
//		// with this.
//		CW.Runtime.initRuntime();
//
//		try {
//			self.setUp();
//		} catch (e) {
//			result.addError(self, e);
//			return result;
//		}
//		try {
//			self[self._methodName]();
//		} catch (e) {
//			if (e instanceof CW.UnitTest.AssertionError) {
//				result.addFailure(self, e); // NEW NOTE: (passing in Error, Failure() this if code re-enabled)
//                // NEW NOTE: check for SkipTest is code re-enabled 
//			} else {
//				result.addError(self, e); // NEW NOTE: (passing in Error, Failure() this if code re-enabled)
//			}
//			success = false;
//		}
//		try {
//			self.tearDown();
//		} catch (e) {
//			result.addError(self, e);
//			success = false;
//		}
//		if (success) {
//			result.addSuccess(self);
//		}
//		result.stopTest(self);
//	};

);


/**
 * Return a nicely formatted summary from the given L{TestResult}.
 */
CW.UnitTest.formatSummary = function formatSummary(result) {
	var summary;
	if (result.wasSuccessful()) {
		summary = "PASSED "
	} else {
		summary = "FAILED "
	}
	summary += "(tests=" + result.testsRun;
	if (result.errors.length > 0) {
		summary += ", errors=" + result.errors.length;
	}
	if (result.failures.length > 0) {
		summary += ", failures=" + result.failures.length;
	}
	if (result.skips.length > 0) {
		summary += ", skips=" + result.skips.length;
	}
	summary += ')';
	return summary;
};


/**
 * Take a L{CW.UnitTest.TestResult} and return a DIV that contains an
 * easily-recognizable image (for automated test systems), along with
 * a number of tests run, errored, and failed.
 * 
 * @param result: a finished L{CW.UnitTest.TestResult}
 * @type result: L{CW.UnitTest.TestResult}
 */
CW.UnitTest.makeSummaryDiv = function makeSummaryDiv(result) {
	var summaryDiv = document.createElement('div');

	var doneImg = document.createElement('img');
	doneImg.src = '/@testres_Coreweb/done.gif';
	summaryDiv.appendChild(doneImg);

	var numberTestsDiv = document.createElement('div');
	var bgColor = 'green';
	if (result.errors.length > 0 || result.failures.length > 0) {
		bgColor = 'red';
	}
	summaryDiv.style.backgroundColor = bgColor;

	var additionalText = '';
	if (result.errors.length > 0) {
		additionalText += ' E=' + result.errors.length;
	}
	if (result.failures.length > 0) {
		additionalText += ' F=' + result.failures.length;
	}
	if (result.skips.length > 0) {
		additionalText += ' S=' + result.skips.length;
	}
	numberTestsDiv.innerHTML =
		'<center style="color:white;font-weight:bold">'+result.testsRun+additionalText+'</center>';
	summaryDiv.appendChild(numberTestsDiv);

	summaryDiv.style.position = 'absolute';
	summaryDiv.style.top = '6px';
	summaryDiv.style.right = '6px';
	summaryDiv.style.padding = '2px';

	return summaryDiv;
}


/**
 * Run the given test, printing the summary of results and any errors.
 *
 * @param test: The test to run.
 * @type test: L{CW.UnitTest.TestCase} or L{CW.UnitTest.TestSuite}
 */
CW.UnitTest.run = function run(test) {
	var div = document.getElementById('CW-test-log');
	var result = CW.UnitTest.DIVTestResult(div);
	var d = test.run(result);
	d.addCallback(function(){	
		var timeTaken = new Date().getTime() - result.timeStarted;

		var span = document.createElement('span');
		span.style.fontWeight = 'bold';
		var textnode = document.createTextNode(
			CW.UnitTest.formatSummary(result) + ' in ' + timeTaken + ' ms');
		span.appendChild(textnode);
		div.appendChild(span);

		div.appendChild(document.createElement('br'));

		var machineNode = document.createTextNode('|*BEGIN-SUMMARY*| ' + result.getSummary().join(',') + ' |*END-SUMMARY*|');
		div.appendChild(machineNode);

		var summaryDiv = CW.UnitTest.makeSummaryDiv(result);
		document.body.appendChild(summaryDiv);
	});
	return d;
};



// no more subunit/spidermonkey
/*
CW.UnitTest.runRemote = function runRemote(test) {
	var result = CW.UnitTest.SubunitTestClient();
	test.run(result);
};*/


/**
 * Return a string representation of an arbitrary value, similar to
 * Python's builtin repr() function.
 */
CW.UnitTest.repr = function repr(value) {

	var cgiEscape = function(s) {
		return value.replace(/\&/g, '&amp;').replace(/\>/g, '&gt;').replace(/\</g, '&lt;');
	}

	// We can't call methods on undefined or null.
	if (value === undefined) {
		return 'undefined';
	} else if (value === null) {
		return 'null';
	} else if (typeof value === 'string') {

	// INCORRECT COMMENT
//		 This backslashing will also break the red in our <font color="red">
//		 Fun fact: In Opera, instead of breaking it to black, it turns blue!
		return '"' + cgiEscape(value).replace(/"/g, '\\"') + '"';
	} else if (typeof value === 'number') {
		return '' + value;
	} else if (value.toSource !== undefined) {
		return value.toSource();
	} else if (value.toString !== undefined) {
		return value.toString();
	} else {
		return '' + value;
	}
};


/* copy pasted from Nevow.Athena.Test.
*
* By having Deferreds in CW.UnitTest we lose the ability to test Deferreds before using them.
*/


/**
 * A visit-controller which applies a specified visitor to the methods of a
 * suite without waiting for the Deferred from a visit to fire before
 * proceeding to the next method.
 */
CW.UnitTest.ConcurrentVisitor = CW.Class.subclass('CW.UnitTest.ConcurrentVisitor');
CW.UnitTest.ConcurrentVisitor.methods(
	function traverse(self, visitor, tests) {
		var deferreds = [];
		CW.msg("Running " + tests.length + " methods/TestCases.");
		for (var i = 0; i < tests.length; ++i) {
			deferreds.push(tests[i].visit(visitor));
		}
		return CW.Defer.DeferredList(deferreds);
	});


/**
 * A visit-controller which applies a specified visitor to the methods of a
 * suite, waiting for the Deferred from a visit to fire before proceeding to
 * the next method.
 */
CW.UnitTest.SerialVisitor = CW.Class.subclass('CW.UnitTest.SerialVisitor');
CW.UnitTest.SerialVisitor.methods(
	function traverse(self, visitor, tests) {
//		CW.msg('Using SerialVisitor on ' + tests);
		var completionDeferred = new CW.Defer.Deferred();
		self._traverse(visitor, tests, completionDeferred, 0);
		return completionDeferred;
	},

	function _traverse(self, visitor, tests, completionDeferred, nowOn) {
		var result, testCase;
		if (nowOn < tests.length) {
			testCase = tests[nowOn]; // at some point this lacked a +1; this bug took an hour to catch.
			result = testCase.visit(visitor);
//			//console.log('for', testCase, 'result is', result);
//			if(result == undefined) {
//				//console.log('undefined caused by ', testCase);
//				debugger;
//			}
			result.addCallback(function(ignored) {
				self._traverse(visitor, tests, completionDeferred, nowOn+1);
			});
		} else {
			// This setTimeout is absolutely necessary (instead of just `completionDeferred.callback(null);`)
			// because we must reduce our stack depth.
			// The test suite will halt (no error) in Safari 3/4 without this setTimeout replacement.
			// Safari 3 reports its recursion limit as ~500; Safari 4 as ~30000
			// (though the '30000' is a lie, because it breaks much earlier during real use).
			//
			// This setTimeout *is* tracked by our setTimeoutMonkey but only for a very short time.
			// (it doesn't interfere with anything)
			setTimeout(function(){completionDeferred.callback(null);}, 0);
		}
	}
);

// alt implementation (without the setTimeout)
//
//
///**
// * A visit-controller which applies a specified visitor to the methods of a
// * suite, waiting for the Deferred from a visit to fire before proceeding to
// * the next method.
// */
//CW.UnitTest.SerialVisitor = CW.Class.subclass('CW.UnitTest.SerialVisitor');
//CW.UnitTest.SerialVisitor.methods(
//	function traverse(self, visitor, tests) {
//		self.runTestNum = tests.length;
//		var completionDeferred = new CW.Defer.Deferred();
//		self._traverse(visitor, tests, completionDeferred);
//		return completionDeferred;
//	},
//
//	function _traverse(self, visitor, tests, completionDeferred) {
//		var result;
//		if (self.runTestNum--) {
//			testCase = tests[self.runTestNum];
//			result = testCase.visit(visitor);
//			result.addCallback(function(ignored) {
//				self._traverse(visitor, tests, completionDeferred);
//			});
//		} else {
//			completionDeferred.callback(null);
//		}
//	});
//


/* TODO: add tests for the 3 visitors.

 */

/**
 * Ignore Deferreds. Access something one by one. Useful for getting test counts.
 *
 * This is how Divmod UnitTest worked.
 */
CW.UnitTest.SynchronousVisitor = CW.Class.subclass('CW.UnitTest.SynchronousVisitor');
CW.UnitTest.SynchronousVisitor.methods(
	function traverse(self, visitor, tests) {
		for (var i = 0; i < tests.length; ++i) {
			// we need to keep the visitSync because TestCase and TestSuite have a different visitSync
			tests[i].visitSync(visitor);
		}
	}
);


/**
 * Note that this doesn't actually cancel anything. It just stops tracking those delayed calls.
 *
 * This is called right before the tests start, and after the teardown of *any test* that ends dirty.
 */
CW.UnitTest.stopTrackingDelayedCalls = function() {
	CW.UnitTest.delayedCalls = {
		'setTimeout_pending': {},
		'setInterval_pending': {}
	};
};


// Initialize the objects
CW.UnitTest.stopTrackingDelayedCalls();


CW.UnitTest.TestResultReceiver = CW.Class.subclass('CW.UnitTest.TestResultReceiver');
CW.UnitTest.TestResultReceiver.methods(
	function a() {}
);



// TODO: maybe generalize Timeout and Interval monkeys? with a monkeyMaker?


CW.UnitTest.setTimeoutMonkey = function(callable, when) {
	var replacementCallable = function() {
//		var originalLen = CW.dir(CW.UnitTest.delayedCalls['setTimeout_pending']).length;
		delete CW.UnitTest.delayedCalls['setTimeout_pending'][this];
//		var newLen = CW.dir(CW.UnitTest.delayedCalls['setTimeout_pending']).length;

		// not very useful message, because test runner knows exactly which test caused the problem in the first place.
//		if(originalLen !== newLen + 1) {
//			CW.msg('{MONKEY} replacementCallable did no cleanup because setTimeout callable ran *after* the test runner already cleaned the delayedCalls.');
//		}

		// actually run the callable
		callable();
	}

	var ticket = null;

	if(window.__CW_setTimeout_bak) {
		ticket = __CW_setTimeout_bak(function(){replacementCallable.call(ticket, [])}, when);
	} else if(window.frames[0] && window.frames[0].setTimeout) {
		ticket = window.frames[0].setTimeout(function(){replacementCallable.call(ticket, [])}, when);
	} else {
		throw new CW.Error("neither setTimeout_bak nor window.frames[0].setTimeout was available.");
	}

	CW.UnitTest.delayedCalls['setTimeout_pending'][ticket] = 1;

	return ticket;
}



CW.UnitTest.setIntervalMonkey = function(callable, when) {
	// interval callable repeats forever until we clearInterval,
	// so we don't need any fancy replacementCallable.

	var ticket = null;

	if(window.__CW_setInterval_bak) {
		ticket = __CW_setInterval_bak(callable, when);
	} else if(window.frames[0] && window.frames[0].setInterval) {
		ticket = window.frames[0].setInterval(callable, when);
	} else {
		throw new CW.Error("neither setInterval_bak nor window.frames[0].setInterval was available.");
	}

	CW.UnitTest.delayedCalls['setInterval_pending'][ticket] = 1;

	return ticket;
}



CW.UnitTest.clearTimeoutMonkey = function(ticket) {

	var output = null;

	if(window.__CW_clearTimeout_bak) {
		output = __CW_clearTimeout_bak(ticket);
	} else if(window.frames[0] && window.frames[0].clearTimeout) {
		output = window.frames[0].clearTimeout(ticket);
	} else {
		throw new CW.Error("neither clearTimeout_bak nor window.frames[0].clearTimeout was available.");
	}

	delete CW.UnitTest.delayedCalls['setTimeout_pending'][ticket];
	return output;
}



CW.UnitTest.clearIntervalMonkey = function(ticket) {

	var output = null;

	if(window.__CW_clearInterval_bak) {
		output = __CW_clearInterval_bak(ticket);
	} else if(window.frames[0] && window.frames[0].clearInterval) {
		output = window.frames[0].clearInterval(ticket);
	} else {
		throw new CW.Error("neither __CW_clearInterval_bak nor window.frames[0].clearInterval was available.");
	}

	delete CW.UnitTest.delayedCalls['setInterval_pending'][ticket];
	return output;
}


/**
 * This needs to be called before tests are started.
 */
CW.UnitTest.installMonkeys = function() {
	//CW.msg('installMonkeys');

	var installD = new CW.Defer.Deferred();

	if(CW.UnitTest.monkeysAreInstalled) {
		CW.msg('Monkeys already installed or being installed.');
		installD.callback(null);
		return installD;
	}

	CW.UnitTest.monkeysAreInstalled = true;

	// This _bak reference-swapping works for every browser except IE.
	// We could just do IE global replacement + iframe original function for *all* browsers,
	// but we don't because it's at higher risk of breaking.
	// (it is indeed mildly broken in Safari 4 beta [2009-03-07])
	//    not anymore when https://bugs.webkit.org/show_bug.cgi?id=24453 is Fixed and Safari 4 ships with it.
	if('\v' !== 'v') { // if not IE
		// TODO: build a CW.Support module that has
		// "supportsSetTimeoutReferenceSwap" instead of making all these IE assumptions
		
		// These "backup" references to the real functions must be properties of window,
		// at least for Firefox 3.5.
		window.__CW_setTimeout_bak = window.setTimeout;
		window.setTimeout = CW.UnitTest.setTimeoutMonkey;
		window.__CW_clearTimeout_bak = window.clearTimeout;
		window.clearTimeout = CW.UnitTest.clearTimeoutMonkey;

		window.__CW_setInterval_bak = window.setInterval;
		window.setInterval = CW.UnitTest.setIntervalMonkey;
		window.__CW_clearInterval_bak = window.clearInterval;
		window.clearInterval = CW.UnitTest.clearIntervalMonkey;
		installD.callback(null);
	} else {
		CW.UnitTest._iframeReady = new CW.Defer.Deferred();

		/*
		 * This special frame keeps unmodified versions of setTimeout,
		 * setInterval, clearTimeout, and clearInterval.
		 *
		 * The id and name are not used by the JS; this frame
		 * is accessed with window.frames[0].  Do not make this src=about:blank
		 * because about:blank is a non-https page,  and will trigger IE6/7/8
		 * mixed content warnings.
		 */

		var body = document.body;
		var iframe = document.createElement("iframe");
		iframe.setAttribute("src", "/@testres_Coreweb/blank.html");
		iframe.setAttribute("id", "__CW_unittest_blank_iframe");
		iframe.setAttribute("name", "__CW_unittest_blank_iframe");

		// Setting onload attribute or .onload property doesn't work in IE (6, 7 confirmed),
		// so attachEvent instead.
		iframe.attachEvent("onload", function(){CW.UnitTest._iframeReady.callback(null);});

		// setAttribute("style", ...  is not working in IE6 or IE7, so use .style instead.
		iframe.style.height = '16px';
		iframe.style.border = '3px';

		body.appendChild(iframe);

		var numFrames = window.frames.length;
		if(numFrames != 1) {
			throw new CW.Error("window.frames.length was " + numFrames);
		}

		function _IE_finishInstallMonkeys() {
			CW.msg('_iframeReady triggered.');
			execScript('\
				function setTimeout(callable, when) {\
					return CW.UnitTest.setTimeoutMonkey(callable, when);\
				}\
				function clearTimeout(ticket) {\
					return CW.UnitTest.clearTimeoutMonkey(ticket);\
				}\
				function setInterval(callable, when) {\
					return CW.UnitTest.setIntervalMonkey(callable, when);\
				}\
				function clearInterval(ticket) {\
					return CW.UnitTest.clearIntervalMonkey(ticket);\
				}'
			);

			installD.callback(null);
		}

		CW.UnitTest._iframeReady.addCallback(_IE_finishInstallMonkeys);
	}

	return installD;
}

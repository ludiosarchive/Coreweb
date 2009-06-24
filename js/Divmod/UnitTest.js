// -*- test-case-name: nevow.test.test_javascript -*-

/**
 * JavaScript unit testing framework, modeled on xUnit.
 */


// import Divmod
// import Divmod.Inspect
//// import Divmod.Runtime


/**
 * Return a suite which contains every test defined in C{testClass}. Assumes
 * that if a method name starts with C{test_}, then it is a test.
 */
Divmod.UnitTest.loadFromClass = function loadFromClass(testClass) {
	var prefix = 'test_';
	var suite = Divmod.UnitTest.TestSuite();
	var methods = Divmod.Inspect.methods(testClass);
	for (var i = 0; i < methods.length; ++i) {
		var name = methods[i];
		if (Divmod.startswith(name, prefix)) {
			suite.addTest(testClass(name));
		}
	}
	return suite;
};


/**
 * Return C{true} is given value is a subclass of L{Divmod.UnitTest.TestCase},
 * C{false} otherwise.
 */
Divmod.UnitTest.isTestCaseClass = function isTestCaseClass(klass) {
	if (klass.subclassOf === undefined) {
		return false;
	}
	return klass.subclassOf(Divmod.UnitTest.TestCase);
};


/**
 * Return a suite which contains every test defined in C{testModule}.
 */
Divmod.UnitTest.loadFromModule = function loadFromModule(testModule, moduleOfModules /*=false*/) {
	var suite = Divmod.UnitTest.TestSuite();
	for (var name in testModule) {
		if(!moduleOfModules) {
			if (Divmod.UnitTest.isTestCaseClass(testModule[name])) {
				suite.addTest(Divmod.UnitTest.loadFromClass(testModule[name]));
			}
		} else {
			// There's no "is a module" flag so this is kind of an ugly hack
			suite.addTest(Divmod.UnitTest.loadFromModule(testModule[name]));
		}
	}
	return suite;
};



/**
 * Raised to indicate that a test has failed.
 */
Divmod.UnitTest.AssertionError = Divmod.Error.subclass('Divmod.UnitTest.AssertionError');
Divmod.UnitTest.AssertionError.methods(
	function toString(self) {
		return 'AssertionError: ' + self.message;
	});


/**
 * Represents the results of a run of unit tests.
 *
 * @type testsRun: integer
 * @ivar testsRun: The number of tests that have been run using this as the
 *				 result.
 *
 * @type failures: Array of [L{TestCase}, L{Divmod.Error}] pairs
 * @ivar failures: The assertion failures that have occurred in this test run,
 *				 paired with the tests that generated them.
 *
 * @type successes: Array of L{TestCase}
 * @ivar successes: A list of tests that succeeded.
 *
 * @type errors: Array of [L{TestCase}, L{Divmod.Error}] pairs
 * @ivar errors: The errors that were raised by tests in this test run, paired
 *			   with the tests that generated them.
 */
Divmod.UnitTest.TestResult = Divmod.Class.subclass('Divmod.UnitTest.TestResult');
Divmod.UnitTest.TestResult.methods(
	function __init__(self) {
		self.testsRun = 0;
		self.failures = [];
		self.successes = [];
		self.errors = [];
	},


	/**
	 * Called by C{TestCase.run} at the start of the test.
	 *
	 * @param test: The test that just started.
	 * @type test: L{Divmod.UnitTest.TestCase}
	 */
	function startTest(self, test) {
		self.testsRun++;
	},


	/**
	 * Called by C{TestCase.run} at the end of the test run.
	 *
	 * @param test: The test that just finished.
	 * @type test: L{Divmod.UnitTest.TestCase}
	 */
	function stopTest(self, test) {
	},


	/**
	 * Report an error that occurred while running the given test.
	 *
	 * @param test: The test that had an error.
	 * @type test: L{Divmod.UnitTest.TestCase}
	 *
	 * @param error: The error that occurred.
	 * @type error: Generally a L{Divmod.Error} instance.
	 */
	function addError(self, test, error) {
		self.errors.push([test, error]);
	},


	/**
	 * Report a failed assertion that occurred while running the given test.
	 *
	 * This has NOTHING to do with Failure objects.
	 *
	 * @param test: The test with the failed assertion.
	 * @type test: L{Divmod.UnitTest.TestCase}
	 *
	 * @param failure: The failure that occurred.
	 * @type failure: A L{Divmod.UnitTest.AssertionError} instance.
	 */
	function addFailure(self, test, failure) {
		self.failures.push([test, failure]);
	},


	/**
	 * Report that the given test succeeded.
	 *
	 * @param test: The test that succeeded.
	 * @type test: L{Divmod.UnitTest.TestCase}
	 */
	function addSuccess(self, test) {
		self.successes.push(test);
	},


	/**
	 * Return a triple of (tests run, number of failures, number of errors)
	 */
	function getSummary(self) {
		return [self.testsRun, self.failures.length, self.errors.length];
	},


	/**
	 * Return C{true} if there have been no failures or errors. Return C{false}
	 * if there have been.
	 */
	function wasSuccessful(self) {
		return self.failures.length == 0 && self.errors.length == 0;
	});


// no more subunit/spidermonkey
/*
Divmod.UnitTest.SubunitTestClient = Divmod.UnitTest.TestResult.subclass('Divmod.UnitTest.SubunitTestClient');
Divmod.UnitTest.SubunitTestClient.methods(
	function _write(self, string) {
		print(string);
	},

	function _sendException(self, error) {
		var f = Divmod.Defer.Failure(error);
		self._write(f.toPrettyText(f.filteredParseStack()));
	},

	function addError(self, test, error) {
		self._write("error: " + test.id() + " [");
		self._sendException(error);
		self._write(']');
	},

	function addFailure(self, test, error) {
		self._write("failure: " + test.id() + " [");
		self._sendException(error);
		self._write(']');
	},

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
Divmod.UnitTest.TestSuite = Divmod.Class.subclass('Divmod.UnitTest.TestSuite');
Divmod.UnitTest.TestSuite.methods(
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
	 * @type test: L{Divmod.UnitTest.TestCase} or L{Divmod.UnitTest.TestSuite}
	 */
	function addTest(self, test) {
		self.tests.push(test);
	},


	/**
	 * Add the given tests to the suite.
	 *
	 * @param tests: An array of tests to add.
	 * @type tests: [L{Divmod.UnitTest.TestCase} or L{Divmod.UnitTest.TestSuite}]
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

		var countVisitor = Divmod.UnitTest.SynchronousVisitor();
		countVisitor.traverse(visitor, self.tests);

		return total;
	},


	/**
	 * Visit each test case in this suite with the given visitor function.
	 */
	function visit(self, visitor) {
		// safari has serious maximum recursion problems
		var sVisitor = Divmod.UnitTest.SerialVisitor(); // or ConcurrentVisitor
		return sVisitor.traverse(visitor, self.tests);
	},


	/**
	 * Visit each test case in this suite with the given visitor function *synchronously*,
	 * ignoring any Deferreds.
	 *
	 * Useful for counting the # of tests and not much else.
	 */
	function visitSync(self, visitor) {
		var testVisitor = Divmod.UnitTest.SynchronousVisitor();
		testVisitor.traverse(visitor, self.tests);
	},



	/**
	 * Run all of the tests in the suite.
	 */
	function run(self, result) {
		Divmod.UnitTest.installMonkeys();

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



/**
 * I represent a single unit test. Subclass me for your own tests.
 *
 * I will be instantiated once per your own test_ method, by L{Divmod.UnitTest.loadFromClass}.
 *
 * I know which asserts/compares are "internal" (called by my own logic) because:
 * some browsers don't have tracebacks in JS,
 * and user wants to know which assert/compare statement in the TestCase failed.
 *
 * To do this tracking, I assert the statement,
 * then increment the counter if the assert came directly
 * from the user's test_ method (and not of my own methods).
 */


Divmod.UnitTest.TestCase = Divmod.Class.subclass('Divmod.UnitTest.TestCase');
Divmod.UnitTest.TestCase.methods(
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
		//return Divmod.Defer.succeed(visitor(self));
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
	 * @throw: Divmod.UnitTest.AssertionError
	 */
	function fail(self, reason) {
		throw self.getFailError(reason);
	},


	/**
	 * Get the right AssertionError. Direct use is useful for testing UnitTest and errbacks.
	 *
	 * @type reason: text
	 * @param reason: Why the test is being failed.
	 * @throw: Divmod.UnitTest.AssertionError
	 */
	function getFailError(self, reason) {
		return Divmod.UnitTest.AssertionError("[" + self._assertCounter + "] " + reason);
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
	 * @raises L{Divmod.UnitTest.AssertionError} if C{predicate} returns
	 * C{false}.
	 */
	function compare(self, predicate, description, a, b,
					 /* optional */ message, internalCompare /*=false*/) {
		var repr = Divmod.UnitTest.repr;
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
	 * Assert that C{a} and C{b} are equal. Recurses into arrays and dicts.
	 */
	function assertArraysEqual(self, a, b, /* optional */ message) {
		self.compare(Divmod.arraysEqual, '<font color="red">not array-equal to</font>', a, b, message, true);
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
				self.assert(
					Divmod.startswith(e.message, expectedMessage),
					"Error started with wrong message: " + e.message, true);
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
	 * @param deferred: The L{Divmod.Defer.Deferred} which is expected to fail.
	 *
	 * @param errorTypes: An C{Array} of L{Divmod.Error} subclasses which are
	 * the allowed failure types for the given Deferred.
	 *
	 * @throw Error: Thrown if C{errorTypes} has a length of 0.
	 *
	 * @rtype: L{Divmod.Defer.Deferred}
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
			}
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
			oneDeferredOrResult = Divmod.Defer.fail(err);
		}


		if (!immediatelyFailed) {
			if (!(oneDeferredOrResult instanceof Divmod.Defer.Deferred)) {
				oneDeferredOrResult = Divmod.Defer.succeed(oneDeferredOrResult);
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

		//print('Starting ' + self + ' ' + self._methodName + '<br>');

		result.startTest(self);

		//// XXX: This probably isn't the best place to put this, but it's the
		//// only place for the time being; see #2806 for the proper way to deal
		//// with this.
		//////Divmod.Runtime.initRuntime(); // no runtime, thanks.

		setUpD = self._maybeWrapWithDeferred(function(){return self.setUp();});

		setUpD.addCallbacks(
			/* callback */
			function(){

				methodD = self._maybeWrapWithDeferred(function(){return self[self._methodName]();});

				//console.log("From " + self._methodName + " got a ", methodD);

				methodD.addErrback(function(aFailure) {
					if (aFailure.error instanceof Divmod.UnitTest.AssertionError) {
						result.addFailure(self, aFailure.error);
					} else {
						result.addError(self, aFailure.error);
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
						result.addError(self, aFailure.error);
						success = false;
					});

					tearDownD.addBoth(function(){
						if (success) {
							var whichProblems = [];
							for(var pendingType in Divmod.UnitTest.delayedCalls) {
								for(var ticket in Divmod.UnitTest.delayedCalls[pendingType]) {
									whichProblems.push(pendingType);
								}
							}

							if(whichProblems.length > 0) {
								success = false;

								result.addError(self, new Divmod.Error(
								"Test ended with "+ whichProblems.length +
								" pending call(s): " + whichProblems));

								// Cleanup everything. If we don't do this, test output is impossible
								// to decipher, because delayed calls "spill over" to future tests.
								Divmod.UnitTest.stopTrackingDelayedCalls();
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
				result.addError(self, aFailure.error);
			}

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
//		Divmod.Runtime.initRuntime();
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
//			if (e instanceof Divmod.UnitTest.AssertionError) {
//				result.addFailure(self, e);
//			} else {
//				result.addError(self, e);
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

//	/**
//	 * Helpful Opera 10 adds garbage to end of your e.message strings.
//	 *
//	 * TODO: maybe consider handling the full stacktraces
//	 * if user has "Exceptions Have Stacktrace" enabled.
//	 */
//	function _noOpera10Trailer(self, error) {
//		// Wow. Opera 10 only lets us replace the message text once per test method or something,
//		// so we return the cleaned message.
//		if(Divmod.window.opera) {
//			var copy = '' + error.message;
//			var replacement = copy.replace(/\r\nstacktrace: n.*/, '');
//			//alert('replacement is ' + replacement);
//			try {
//			error.message = replacement; // this only works sometimes as mentioned above
//			} catch(ignored) {}
//			return replacement;
//		}
//		return error.message;
//	}

);


/**
 * Return a nicely formatted summary from the given L{TestResult}.
 */
Divmod.UnitTest.formatSummary = function formatSummary(result) {
	var summary;
	if (result.wasSuccessful()) {
		summary = "PASSED "
	} else {
		summary = "FAILED "
	}
	summary += "(tests=" + result.testsRun;
	if (result.errors.length > 0) {
		summary += ", errors=" + result.errors.length
	}
	if (result.failures.length > 0) {
		summary += ", failures=" + result.failures.length;
	}
	summary += ')';
	return summary;
};



/**
 * Return a formatted string containing all the errors and failures in a result
 *
 * @param result: A test result.
 * @type result: L{Divmod.UnitTest.TestResult}
 */
Divmod.UnitTest.formatErrors = function formatErrors(result) {
	var format = '';
	var i;
	for (i = 0; i < result.errors.length; ++i) {
		format += Divmod.UnitTest.formatError('ERROR',
											  result.errors[i][0],
											  result.errors[i][1]);
		format += '<br>\n';
	}
	for (i = 0; i < result.failures.length; ++i) {
		format += Divmod.UnitTest.formatError('FAILURE',
											  result.failures[i][0],
											  result.failures[i][1]);
		format += '<br>\n';
	}
	return format;
};



/**
 * Return a formatted string containing all the successes in a result
 *
 * @param result: A test result.
 * @type result: L{Divmod.UnitTest.TestResult}
 */
Divmod.UnitTest.formatSuccesses = function formatErrors(result) {
	var format = '';
	var i;
	for (i = 0; i < result.successes.length; ++i) {
		format += '[SUCCESS] ' + result.successes[i].id() + '<br>\n';
	}
	return format;
};



/**
 * Return a formatting string showing the failure/error that occurred in a test.
 *
 * @param test: A test which had a failure or error.
 * @type test: L{Divmod.UnitTest.TestCase}
 *
 * @param error: An error or failure which occurred in the test.
 * @type error: L{Divmod.Error}
 */
Divmod.UnitTest.formatError = function formatError(kind, test, error) {
	var ret = '[' + kind + '] ' + test.id() + ':\n\n' + error.message + '\n';

	// this is just really annoying
	//var f = Divmod.Defer.Failure(error);
	//ret += f.toPrettyText(f.filteredParseStack()) + '\n';
	
	return ret;
};



/**
 * Run the given test, printing the summary of results and any errors. If run
 * inside a web browser, it will try to print these things to the printer, so
 * don't use this in a web browser.
 *
 * @param test: The test to run.
 * @type test: L{Divmod.UnitTest.TestCase} or L{Divmod.UnitTest.TestSuite}
 */
Divmod.UnitTest.run = function run(test) {
	var result = Divmod.UnitTest.TestResult();
	var start = new Date().getTime();
	var d = test.run(result);
	d.addCallback(function(){
		var timeTaken = new Date().getTime() - start;
		print('<b>' + Divmod.UnitTest.formatSummary(result) + '</b> in '+timeTaken+' ms<br>');
		print(Divmod.UnitTest.formatErrors(result));
		print('<a href="#" onclick="jQuery(\'#successes\').show();return false">Show successes</a>');
		print('<div id="successes">' + Divmod.UnitTest.formatSuccesses(result) + '</div>');
	});
	return d;
};



// no more subunit/spidermonkey
/*
Divmod.UnitTest.runRemote = function runRemote(test) {
	var result = Divmod.UnitTest.SubunitTestClient();
	test.run(result);
};*/


/**
 * Return a string representation of an arbitrary value, similar to
 * Python's builtin repr() function.
 */
Divmod.UnitTest.repr = function repr(value) {

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
* By having Deferreds in Divmod.UnitTest we lose the ability to test Deferreds before using them.
*/


/**
 * A visit-controller which applies a specified visitor to the methods of a
 * suite without waiting for the Deferred from a visit to fire before
 * proceeding to the next method.
 */
Divmod.UnitTest.ConcurrentVisitor = Divmod.Class.subclass('Divmod.UnitTest.ConcurrentVisitor');
Divmod.UnitTest.ConcurrentVisitor.methods(
	function traverse(self, visitor, tests) {
		var deferreds = [];
		Divmod.msg("Running " + tests.length + " methods/TestCases.");
		for (var i = 0; i < tests.length; ++i) {
			deferreds.push(tests[i].visit(visitor));
		}
		return Divmod.Defer.DeferredList(deferreds);
	});


/**
 * A visit-controller which applies a specified visitor to the methods of a
 * suite, waiting for the Deferred from a visit to fire before proceeding to
 * the next method.
 */
Divmod.UnitTest.SerialVisitor = Divmod.Class.subclass('Divmod.UnitTest.SerialVisitor');
Divmod.UnitTest.SerialVisitor.methods(
	function traverse(self, visitor, tests) {
//		print('Using SerialVisitor on ' + tests);
		var completionDeferred = Divmod.Defer.Deferred();
		self._traverse(visitor, tests, completionDeferred, 0);
		return completionDeferred;
	},

	function _traverse(self, visitor, tests, completionDeferred, nowOn) {
		var result;
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
			// This setTimeout is absolute necessary (instead of just `completionDeferred.callback(null);`)
			// because we must reduce the amount of recursion.
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

// alt implementation
//
//
///**
// * A visit-controller which applies a specified visitor to the methods of a
// * suite, waiting for the Deferred from a visit to fire before proceeding to
// * the next method.
// */
//Divmod.UnitTest.SerialVisitor = Divmod.Class.subclass('Divmod.UnitTest.SerialVisitor');
//Divmod.UnitTest.SerialVisitor.methods(
//	function traverse(self, visitor, tests) {
//		self.runTestNum = tests.length;
//		var completionDeferred = Divmod.Defer.Deferred();
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
 * This was the old behavior.
 */
Divmod.UnitTest.SynchronousVisitor = Divmod.Class.subclass('Divmod.UnitTest.SynchronousVisitor');
Divmod.UnitTest.SynchronousVisitor.methods(
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
Divmod.UnitTest.stopTrackingDelayedCalls = function() {
	Divmod.UnitTest.delayedCalls = {
		'setTimeout_pending': {},
		'setInterval_pending': {}
	};
};


Divmod.UnitTest.stopTrackingDelayedCalls();



// TODO: maybe generalize Timeout and Interval monkeys? with a monkeyMaker?


Divmod.UnitTest.setTimeoutMonkey = function(callable, when) {
	var replacementCallable = function() {
//		var originalLen = Divmod.dir(Divmod.UnitTest.delayedCalls['setTimeout_pending']).length;
		delete Divmod.UnitTest.delayedCalls['setTimeout_pending'][this];
//		var newLen = Divmod.dir(Divmod.UnitTest.delayedCalls['setTimeout_pending']).length;

		// not very useful message, because test runner knows exactly which test caused the problem in the first place.
//		if(originalLen !== newLen + 1) {
//			print('{MONKEY} replacementCallable did no cleanup because setTimeout callable ran *after* the test runner already cleaned the delayedCalls.<br>');
//		}

		// actually run the callable
		callable();
	}

	var ticket = null;

	if(Divmod.window.setTimeout_bak) {
		ticket = setTimeout_bak(function(){replacementCallable.call(ticket, [])}, when);
	} else if(Divmod.window.frames[0] && Divmod.window.frames[0].setTimeout) {
		ticket = Divmod.window.frames[0].setTimeout(function(){replacementCallable.call(ticket, [])}, when);
	} else {
		throw new Error("neither setTimeout_bak nor Divmod.window.frames[0].setTimeout was available.");
	}

	Divmod.UnitTest.delayedCalls['setTimeout_pending'][ticket] = 1;

	return ticket;
}



Divmod.UnitTest.setIntervalMonkey = function(callable, when) {
	// interval callable repeats forever until we clearInterval,
	// so we don't need any fancy replacementCallable.

	var ticket = null;

	if(Divmod.window.setInterval_bak) {
		ticket = setInterval_bak(callable, when);
	} else if(Divmod.window.frames[0] && Divmod.window.frames[0].setInterval) {
		ticket = Divmod.window.frames[0].setInterval(callable, when);
	} else {
		throw new Error("neither setInterval_bak nor Divmod.window.frames[0].setInterval was available.");
	}

	Divmod.UnitTest.delayedCalls['setInterval_pending'][ticket] = 1;

	return ticket;
}



Divmod.UnitTest.clearTimeoutMonkey = function(ticket) {

	var output = null;

	if(Divmod.window.clearTimeout_bak) {
		output = clearTimeout_bak(ticket);
	} else if(Divmod.window.frames[0] && Divmod.window.frames[0].clearTimeout) {
		output = Divmod.window.frames[0].clearTimeout(ticket);
	} else {
		throw new Error("neither clearTimeout_bak nor Divmod.window.frames[0].clearTimeout was available.");
	}

	delete Divmod.UnitTest.delayedCalls['setTimeout_pending'][ticket];
	return output;
}



Divmod.UnitTest.clearIntervalMonkey = function(ticket) {

	var output = null;
	
	if(Divmod.window.clearInterval_bak) {
		output = clearInterval_bak(ticket);
	} else if(Divmod.window.frames[0] && Divmod.window.frames[0].clearInterval) {
		output = Divmod.window.frames[0].clearInterval(ticket);
	} else {
		throw new Error("neither clearInterval_bak nor Divmod.window.frames[0].clearInterval was available.");
	}

	delete Divmod.UnitTest.delayedCalls['setInterval_pending'][ticket];
	return output;
}


/**
 * This needs to be called before tests are started.
 */
Divmod.UnitTest.installMonkeys = function() {

	if(Divmod.UnitTest.monkeysAreInstalled) {
		Divmod.debug('Monkeys already installed.');
		return;
	}

	// This _bak reference-swapping works for every browser except IE.
	// We could just do IE global replacement + iframe original function for *all* browsers,
	// but we don't because it's at higher risk of breaking.
	// (it is indeed mildly broken in Safari 4 beta [2009-03-07])
	//    not anymore when https://bugs.webkit.org/show_bug.cgi?id=24453 is Fixed and Safari 4 ships with it.
	if('\v' !== 'v') { // if not IE
		// TODO: build a Divmod.Support module that has
		// "supportsSetTimeoutReferenceSwap" instead of making all these IE assumptions

		Divmod.window.setTimeout_bak = Divmod.window.setTimeout;
		Divmod.window.setTimeout = Divmod.UnitTest.setTimeoutMonkey;
		Divmod.window.clearTimeout_bak = Divmod.window.clearTimeout;
		Divmod.window.clearTimeout = Divmod.UnitTest.clearTimeoutMonkey;

		Divmod.window.setInterval_bak = Divmod.window.setInterval;
		Divmod.window.setInterval = Divmod.UnitTest.setIntervalMonkey;
		Divmod.window.clearInterval_bak = Divmod.window.clearInterval;
		Divmod.window.clearInterval = Divmod.UnitTest.clearIntervalMonkey;
	} else {
		execScript('\
			function setTimeout(callable, when) {\
				return Divmod.UnitTest.setTimeoutMonkey(callable, when);\
			}\
			function clearTimeout(ticket) {\
				return Divmod.UnitTest.clearTimeoutMonkey(ticket);\
			}\
			function setInterval(callable, when) {\
				return Divmod.UnitTest.setIntervalMonkey(callable, when);\
			}\
			function clearInterval(ticket) {\
				return Divmod.UnitTest.clearIntervalMonkey(ticket);\
			}'
		);
	}

	Divmod.UnitTest.monkeysAreInstalled = true;
}

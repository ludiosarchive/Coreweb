/**
 * JavaScript unit testing framework, modeled on xUnit.
 *
 * Heavy modified from the Divmod UnitTest.js to add support
 * for Deferreds in test methods, setUp, and tearDown.
 */

goog.require('goog.array');
goog.require('goog.userAgent');
goog.require('goog.asserts');
goog.require('goog.async.Deferred');
goog.require('goog.async.DeferredList');
goog.require('goog.debug');
goog.require('goog.debug.Logger');
goog.require('goog.debug.Error');
goog.require('goog.string');


CW.UnitTest.logger = goog.debug.Logger.getLogger('CW.UnitTest');
CW.UnitTest.logger.setLevel(goog.debug.Logger.Level.ALL);


/**
 * Return a suite which contains every test defined in C{testClass}. Assumes
 * that if a method name starts with C{test_}, then it is a test.
 */
CW.UnitTest.loadFromClass = function loadFromClass(testClass) {
	var prefix = 'test_';
	var suite = CW.UnitTest.TestSuite();
	var methods = CW.methods(testClass);
	for (var i = 0; i < methods.length; ++i) {
		var name = methods[i];
		if (CW.startswith(name, prefix)) {
			suite.addTest(testClass(name));
		}
	}
	return suite;
};


/**
 * @return: C{true} if C{klass} is a subclass of L{CW.UnitTest.TestCase}
 * C{false} otherwise.
 */
CW.UnitTest.isTestCaseClass = function isTestCaseClass(klass) {
	if (klass.subclassOf === undefined) {
		return false;
	}
	if(!klass.subclassOf(CW.UnitTest.TestCase)) {
		return false;
	}
	return true;
};


/**
 * @return: C{true} if C{klass} is a subclass of L{CW.UnitTest.TestCase}
 * and its name does not start with "_", C{false} otherwise.
 */
CW.UnitTest.isRunnableTestCaseClass = function isRunnableTestCaseClass(klass) {
	if(!CW.UnitTest.isTestCaseClass(klass)) {
		return false;
	}
	// JavaScript has no multiple inheritance, which makes defining
	// a "base class" with tests, and then defining a real test case
	// that subclasses (BaseTestClass, CW.UnitTest.TestCase) impossible.
	// So, we implement this primitive system that avoids running TestCase
	// subclasses that start with "_".
	var namePieces = klass.__name__.split('.');
	var lastPiece = namePieces[namePieces.length - 1];
	if (lastPiece.substr(0, 1) == '_') {
		CW.UnitTest.logger.info('CW.UnitTest.isRunnableTestCaseClass: ' +
			'assuming ' + klass + ' is not a runnable TestCase class.');
		return false;
	}
	return true;
};


/**
 * Return a suite which contains every test defined in C{testModule}.
 */
CW.UnitTest.loadFromModule = function loadFromModule(testModule) {
	var suite = CW.UnitTest.TestSuite();
	for (var name in testModule) {
		if (CW.UnitTest.isRunnableTestCaseClass(testModule[name])) {
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
			if (CW.UnitTest.isRunnableTestCaseClass(testModule[name])) {
				suite.addTest(CW.UnitTest.loadFromClass(testModule[name]));
			}
		}
	}
	return suite;
};


/**
 * Raised to indicate that a test is being skipped.
 */
CW.UnitTest.SkipTest = function(opt_msg) {
	goog.debug.Error.call(this, opt_msg);
};
goog.inherits(CW.UnitTest.SkipTest, goog.debug.Error);
CW.UnitTest.SkipTest.prototype.name = 'CW.UnitTest.SkipTest';


CW.UnitTest.browserAddsCrapToErrorMessages = goog.userAgent.OPERA;



/**
 * Represents the results of a run of unit tests.
 *
 * @type testsRun: integer
 * @ivar testsRun: The number of tests that have been run using this as the
 *				 result.
 *
 * @type successes: Array of L{TestCase}
 * @ivar successes: A list of tests that succeeded.
 *
 * @type failures: Array of [L{TestCase}, L{CW.AssertionError}] pairs
 * @ivar failures: The assertion failures that have occurred in this test run,
 *				 paired with the tests that generated them.
 *
 * @type errors: Array of [L{TestCase}, L{Error}] pairs
 * @ivar errors: The errors that were raised by tests in this test run, paired
 *			   with the tests that generated them.
 *
 * @type skips: Array of [L{TestCase}, L{CW.UnitTest.SkipTest}] pairs
 * @ivar skips: The SkipTest exceptions that were raised by tests in this test run,
 * 				paired with the tests that generated them.
 *
 */
CW.Class.subclass(CW.UnitTest, 'TestResult').methods(
	function __init__(self) {
		self.testsRun = 0;
		self.successes = [];
		self.failures = [];
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
	 * @type error: Generally an L{Error} instance, but could be
	 * 				any throwable object (all of them).
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
	 * @type failure: A L{CW.AssertionError} instance.
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
	 * @type failure: A L{CW.UnitTest.SkipTest} instance.
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
CW.UnitTest.TestResult.subclass(CW.UnitTest, 'DIVTestResult').methods(
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
		//console.log(error);
		CW.UnitTest.DIVTestResult.upcall(self, 'addError', [test, error]);
		var br = document.createElement("br");
		var textnode = document.createTextNode('... ERROR');
		var pre = document.createElement("pre");
		pre.innerHTML = goog.debug.exposeException(error);
		self._div.appendChild(textnode);
		self._div.appendChild(br);
		self._div.appendChild(pre);

	},


	function addFailure(self, test, failure) {
		CW.UnitTest.DIVTestResult.upcall(self, 'addFailure', [test, failure]);
		var br = document.createElement("br");
		var textnode = document.createTextNode('... FAILURE');
		var pre = document.createElement("pre");
		pre.innerHTML = goog.debug.exposeException(failure);
		self._div.appendChild(textnode);
		self._div.appendChild(br);
		self._div.appendChild(pre);
		//self._div.appendChild(failure.toPrettyNode());
	},


	function addSkip(self, test, skip) {
		CW.UnitTest.DIVTestResult.upcall(self, 'addSkip', [test, skip]);
		var br = document.createElement("br");
		var textnode = document.createTextNode('... SKIP: ' + skip.message);
		self._div.appendChild(textnode);
		self._div.appendChild(br);
		//self._div.appendChild(skip.toPrettyNode());
	},


	function addSuccess(self, test) {
		CW.UnitTest.DIVTestResult.upcall(self, 'addSuccess', [test]);
		var br = document.createElement("br");
		var textnode = document.createTextNode('... OK');
		self._div.appendChild(textnode);
		self._div.appendChild(br);
	}
);



/**
 * Print tests results to the console, as they are run. If you try to use
 * this in a browser environment, it will repeatedly open the 'print page'
 * dialog.
 */
CW.UnitTest.TestResult.subclass(CW.UnitTest, 'ConsoleTestResult').methods(
	function __init__(self) {
		CW.UnitTest.ConsoleTestResult.upcall(self, '__init__', []);
	},


	function startTest(self, test) {
		CW.UnitTest.ConsoleTestResult.upcall(self, 'startTest', [test]);
		print(test.id());
	},


	function addError(self, test, error) {
		CW.UnitTest.ConsoleTestResult.upcall(self, 'addError', [test, error]);
		print('... ERROR\n');
		print('\n' + error.toString() + '\n\n');
	},


	function addFailure(self, test, failure) {
		CW.UnitTest.ConsoleTestResult.upcall(self, 'addFailure', [test, failure]);
		print('... FAILURE\n');
		print('\n' + failure.toString() + '\n\n');
	},


	function addSkip(self, test, skip) {
		CW.UnitTest.ConsoleTestResult.upcall(self, 'addSkip', [test, skip]);
		print('... SKIP\n');
		print('\n' + skip.toString() + '\n\n');
	},


	function addSuccess(self, test) {
		CW.UnitTest.ConsoleTestResult.upcall(self, 'addSuccess', [test]);
		print('... OK\n');
	}
);




// no more subunit/spidermonkey
/*
CW.UnitTest.TestResult.subclass(CW.UnitTest, 'SubunitTestClient').methods(
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
CW.Class.subclass(CW.UnitTest, 'TestSuite').methods(
	function __init__(self, /*optional*/ tests) {
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
		var sVisitor = CW.UnitTest.SerialVisitor();
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

		installD.addCallback(function _TestSuite_run_visit_cases(){
			var d = self.visit(function (test) { return test.run(result); });

			/**
			 * Possibly make it easier to figure out when IE is leaking memory.
			 * Not really needed, especially because sIEve does this for us on the blank page.
			 */
			d.addBoth(function _TestSuite_run_CollectGarbage(){
				if (typeof CollectGarbage != 'undefined') {
					CollectGarbage();
				}
			});
			return d;
		});
		// Not needed, goog.async.Deferred will throw the error into the window if needed
		//installD.addErrback(CW.err);
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


CW.Class.subclass(CW.UnitTest, 'TestCase').methods(
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
		return visitor(self);
	},


	/**
	 * Visit this test case synchronously.
	 *
	 * @param visitor: A callable which takes one argument (a test case).
	 */
	function visitSync(self, visitor) {
		visitor(self);
	},


	/**
	 * Get the right AssertionError. Direct use is useful for testing UnitTest and errbacks.
	 *
	 * @type reason: text
	 * @param reason: Why the test is being failed.
	 * @return: L{CW.AssertionError} instance.
	 */
	function getFailError(self, reason) {
		return new CW.AssertionError("[" + self._assertCounter + "] " + reason);
	},


	/**
	 * Fail the test. Equivalent to an invalid assertion.
	 *
	 * @type reason: text
	 * @param reason: Why the test is being failed.
	 * @throw: CW.AssertionError
	 */
	function fail(self, reason) {
		throw self.getFailError(reason);
	},


	/**
	 * Assert that the given value is truthy.
	 *
	 * @type value: boolean
	 * @param value: The thing we are asserting.
	 *
	 * @type message: text
	 * @param message: An optional parameter, explaining what the assertion
	 * means.
	 */
	function assert(self, value, /*optional*/ message, /*optional*/ _internalCall /*=false*/) {
		if (!value) {
			self.fail(message);
		}
		if(_internalCall !== true) {
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
	 * @raises L{CW.AssertionError} if C{predicate} returns
	 * C{false}.
	 */
	function compare(self, predicate, description, a, b,
					 /*optional*/ message, /*optional*/ _internalCall /*=false*/) {
		var repr = CW.UnitTest.repr;
		if (!predicate(a, b)) {
			var msg = repr(a) + " " + description + " " + repr(b);
			if (message != null) {
				msg += ': ' + message;
			}
			self.fail(msg);
		}
		if(_internalCall !== true) {
			self._assertCounter += 1;
		}
	},


	/**
	 * Assert that Arrays C{a} and C{b} are equal.
	 * Uses a shallow comparison of items, strict equality (===).
	 */
	function assertArraysEqual(self, a, b, /*optional*/ message, /*optional*/ _internalCall /*=false*/) {
		self.compare(goog.array.equals, '`not array-equal to´', a, b, message, true);
		if(_internalCall !== true) {
			self._assertCounter += 1;
		}
	},


	/**
	 * Assert that Arrays C{a} and C{b} are not equal.
	 * Uses a shallow comparison of items, strict inequality (!==).
	 */
	function assertArraysNotEqual(self, a, b, /*optional*/ message, /*optional*/ _internalCall /*=false*/) {
		var invert = function(func) {
			return function _inverter(){
				return !func.apply(this, arguments);
			};
		};
		var arraysNotEqual = invert(goog.array.equals);
		self.compare(arraysNotEqual, '`array-equal to´', a, b, message, true);
		if(_internalCall !== true) {
			self._assertCounter += 1;
		}
	},


	/**
	 * Assert that C{a} and C{b} are ===.
	 */
	function assertIdentical(self, a, b, /*optional*/ message, /*optional*/ _internalCall /*=false*/) {
		self.compare(function (x, y) { return x === y; },
					 '`!==´', a, b, message, true);
		if(_internalCall !== true) {
			self._assertCounter += 1;
		}
	},


	/**
	 * Assert that C{a} and C{b} are !==.
	 */
	function assertNotIdentical(self, a, b, /*optional*/ message, /*optional*/ _internalCall /*=false*/) {
		self.compare(function (x, y) { return !(x === y); },
					 '`===´', a, b, message, true);
		if(_internalCall !== true) {
			self._assertCounter += 1;
		}
	},


	/**
	 * Assert that C{a} is "in" C{b}. Remember that JavaScript "in" only
	 * checks if a property exists.
	 */
	 function assertIn(self, a, b, /*optional*/ message, /*optional*/ _internalCall /*=false*/) {
		self.compare(function(x, y){ return x in y }, "`not in´", a, b, message, true);
		if(_internalCall !== true) {
			self._assertCounter += 1;
		}
	 },


	/**
	 * Assert that C{a} is not "in" C{b}. Remember that JavaScript "in"
	 * only checks if a property exists.
	 */
	 function assertNotIn(self, a, b, /*optional*/ message, /*optional*/ _internalCall /*=false*/) {
		self.compare(function(x, y){ return !(x in y) }, "`in´", a, b, message, true);
		if(_internalCall !== true) {
			self._assertCounter += 1;
		}
	 },


	/**
	 * Assert that C{a} and C{b} are equal. This handles strings, arrays,
	 * objects, numbers, bools, and nulls.
	 *
	 * Don't give this non-simple objects ("non-simple": functions,
	 * callable host objects, Dates, RegExps, and so on.) Give it objects
	 * made from object literals and new Object() calls only.
	 *
	 * If you give this function non-simple objects, it may produce lies.
	 * If you give this function circularly-referenced objects, it will overflow
	 * the stack.
	 */
	 // TODO: this could be further improved to handle Dates and a few other
	 // types properly; see http://philrathe.com/articles/equiv and qunit/testrunner.js
	function assertEqual(self, a, b, /*optional*/ message, /*optional*/ _internalCall /*=false*/) {
		// Implementation note: these "original message"s will get nested if you have
		// nested objects/arrays.

		var k;

		function isArray(obj) {
			return Object.prototype.toString.apply(obj) === '[object Array]';
		}

		// If a === b, we don't need to dig through them. But if you somehow find an object
		// in JavaScriptland that ==='s successfully but isn't identical, you should remove
		// this short-circuit.
		if(a === b) {

		} else if(a === null || b === null) {
			// Because C{null} has typeof C{object} and may successfully iterate (though with 0 properties),
			// we need to catch it early and do a direct === comparison if either C{a} or C{b} are C{null}
			self.assertIdentical(a, b, message, true);

		} else if(isArray(a) && isArray(b)) {
			// This is a deep (recursive) comparison, unlike assertArraysEqual or goog.array.equals

			var i;
			self.assertIdentical(a.length, b.length, "array length mismatch; original message: " + message, true);

			for (i in a) {
				self.assertIn(i, b, "array item #"+i+" not in b; original message: " + message, true);
				self.assertEqual(a[i], b[i],
					"array item mismatch a["+i+"] `not assertEqual` b["+i+"]; original message: " + message, true);
			}
			for (i in b) {
				// We already checked for equality when we iterated over C{a}, so just
				// check that everything in C{b} is in C{a}
				self.assertIn(i, a, "array item #"+i+" not in a; original message: " + message, true);
			}
		} else if(typeof a == 'object' && typeof b == 'object') {
			// TODO: could be slightly optimized by comparing __count__ first (available in Firefox)
			for(k in a) {
				self.assertEqual(a[k], b[k],
					"property mismatch a["+k+"] `not assertEqual` b["+k+"]; original message: " + message, true);
			};
			for(k in b) {
				self.assertEqual(b[k], a[k],
					"property mismatch b["+k+"] `not assertEqual` a["+k+"]; original message: " + message, true);
			};
		} else {
			self.assertIdentical(a, b, message, true);
		}

		if(_internalCall !== true) {
			self._assertCounter += 1;
		}
	},


	// TODO: assertNotEqual


	function assertErrorMessage(self, e, expectedMessage, _internalCall /*=false*/) {
		var errorMessage = e.message;
		if(!CW.UnitTest.browserAddsCrapToErrorMessages) {
			self.assertIdentical(errorMessage, expectedMessage,
				"Error was of wrong message: " + errorMessage, true);
		} else {
			self.assert(
				CW.startswith(errorMessage, expectedMessage),
				"Error started with wrong message: " + errorMessage, true);
		}
		if(_internalCall !== true) {
			self._assertCounter += 1;
		}
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
	 * must be of type L{Error} or a subclass of it.
	 *
	 * @throw AssertionError: Thrown if the callable doesn't throw
	 * C{expectedError}. This could be because it threw a different error or
	 * because it didn't throw any errors.
	 *
	 * @return: The exception that was raised by callable.
	 */
	function assertThrows(self, expectedError, callable,
	/*optional*/expectedMessage, /*optional*/ _internalCall /*=false*/) {
		var threw = null;
		try {
			callable();
		} catch (e) {
			threw = e;
			self.assert(e instanceof expectedError,
						"Wrong error type thrown: " + e, true);
			if(expectedMessage !== undefined) {
				self.assertErrorMessage(e, expectedMessage, true);
			}
		}
		self.assert(threw != null, "Callable threw no error", true);
		if(_internalCall !== true) {
			self._assertCounter += 1;
		}
		return threw;
	},


	// assertFailure was copied from Nevow.Athena.Test; heavily modified

	/**
	 * Add a callback and an errback to the given Deferred which will assert
	 * that it is errbacked with one of the specified error types.
	 *
	 * This "Failure" has to do with the "Failure" objects, not the assert failures.
	 *
	 * @param deferred: The L{goog.async.Deferred} which is expected to fail.
	 *
	 * @param errorTypes: An C{Array} of L{Error} subclasses which are
	 * the allowed failure types for the given Deferred.
	 *
	 * @throw Error: Thrown if C{errorTypes} has a length of 0.
	 *
	 * @rtype: L{goog.async.Deferred}
	 *
	 * @return:
	 *    if the input Deferred fails with one of the types specified in C{errorTypes},
	 *          a Deferred which will fire callback with a 1 item list: [the error object]
	 *          with which the input Deferred failed
	 *    else,
	 *          a Deferred which will fire errback with a L{CW.AssertionError}.
	 */
	function assertFailure(self, deferred, errorTypes, /*optional*/ _internalCall /*=false*/) {
		if (errorTypes.length == 0) {
			throw new Error("Specify at least one error class to assertFailure");
		}

		var d = deferred.addCallbacks(
			function(result) {
				self.fail("Deferred reached callback; expected an errback.");
			},
			function(err) {
				for (var i = 0; i < errorTypes.length; ++i) {
					if (err instanceof errorTypes[i]) {
						return [err];
					}
				}
				self.fail("Expected " + errorTypes + ", got " + err);
			}
		);
		// TODO: is this really the best place to increment the counter? maybe it should be in the function(err)?
		if(_internalCall !== true) {
			self._assertCounter += 1;
		}
		return d;
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


	/**
	 * Actually run this test. This is designed to operate very much like C{twisted.trial.unittest}
	 */
	function run(self, result) {
		var success = true;
		var setUpD, methodD, tearDownD;

		CW.UnitTest.logger.info('Starting ' + self + ' ' + self._methodName);

		result.startTest(self);

		setUpD = goog.async.Deferred.maybeDeferred(
			function _TestCase_run_wrap_setUp(){ return self.setUp(); }
		);

		setUpD.addCallbacks(
			/* callback */
			function _TestCase_run_setUpD_callback(){

				methodD = goog.async.Deferred.maybeDeferred(
					function _TestCase_run_wrap_method(){ return self[self._methodName](); }
				);

				//console.log("From " + self._methodName + " got a ", methodD);

				methodD.addErrback(function _TestCase_run_methodD_errback(anError) {
					if (anError instanceof CW.AssertionError) {
						result.addFailure(self, anError);
					} else if (anError instanceof CW.UnitTest.SkipTest) {
						result.addSkip(self, anError);
					} else {
						result.addError(self, anError);
					}
					success = false;
				});

				// even if the test_ method fails, we must run tearDown.
				methodD.addBoth(function _TestCase_run_methodD_finally(){

					// for some debugging, prepend the closure with
					// console.log("in teardown after", self._methodName);

					tearDownD = goog.async.Deferred.maybeDeferred(
						function _TestCase_run_wrap_tearDown(){ return self.tearDown(); }
					);

					// Approaching the end of our journey...

					tearDownD.addErrback(function _TestCase_run_tearDownD_errback(anError) {
						// This might be the second time C{result.addError} is called,
						// because an error in both the method *and* tearDown is possible. 
						result.addError(self, anError);
						success = false;
					});

					tearDownD.addBoth(function _TestCase_run_tearDownD_finally() {
						if (success) {
							var whichProblems = [];
							for(var pendingType in CW.UnitTest.delayedCalls) {
								for(var ticket in CW.UnitTest.delayedCalls[pendingType]) {
									CW.UnitTest.logger.severe(goog.string.subs("Leftover pending call: %s %s", pendingType, ticket));
									whichProblems.push(pendingType);
								}
							}

							if(whichProblems.length > 0) {
								success = false;

								result.addError(self,
									new Error(
										"Test ended with " + whichProblems.length +
										" pending call(s): " + whichProblems));

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
			function _TestCase_run_setUpD_errback(anError){
				// Assertions are not allowed in C{setUp}, so we'll treat them an error.
				if (anError instanceof CW.UnitTest.SkipTest) {
					result.addSkip(self, anError);
				} else {
					result.addError(self, anError);
				}
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
//			if (e instanceof CW.AssertionError) {
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
 * Run the given test, printing the summary of results and any errors
 * to a DIV with id 'CW-test-log', then display an summary in the top-
 * right corner.
 *
 * @param test: The test to run.
 * @type test: L{CW.UnitTest.TestCase} or L{CW.UnitTest.TestSuite}
 */
CW.UnitTest.runWeb = function runWeb(test) {
	var div = document.getElementById('CW-test-log');
	var result = CW.UnitTest.DIVTestResult(div);
	var d = test.run(result);
	d.addCallback(function _UnitTest_after_run(){	
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



/**
 * Run the given test, printing the summary of results and any errors
 * to the console, which must have a print statement in the global object.
 *
 * @param test: The test to run.
 * @type test: L{CW.UnitTest.TestCase} or L{CW.UnitTest.TestSuite}
 */
CW.UnitTest.runConsole = function runConsole(test) {
	var result = CW.UnitTest.ConsoleTestResult();
	var d = test.run(result);
	d.addCallback(function _UnitTest_after_run(){
		var timeTaken = new Date().getTime() - result.timeStarted;

		print(CW.UnitTest.formatSummary(result) + ' in ' + timeTaken + ' ms\n');
		// If you forget the newline at the end of this line, Node.js will drop the line completely.
		print('|*BEGIN-SUMMARY*| ' + result.getSummary().join(',') + ' |*END-SUMMARY*|\n');
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
 *
 * Copied from (same content)
 *    http://blog.livedoor.jp/dankogai/js/uneval.txt
 *    http://bulkya.blogdb.jp/share/browser/lang/javascript/clone/trunk/uneval.js
 *
 * TODO XXX LICENSE
 *
 * Modified:
 *    "str\"i'ng" instead of 'str\'i\"ng'
 *    fixed a major bug in escapeChar
 *    fixed a bug in char2esc - "\r" was incorrect
 *    fixed to make recursive calls with noParens when iterating an array
 *    remove short escape for vertical tab, because JScript doesn't support it.
 * 
 * Differs from our old repr:
 *    no more superfluous spaces between items in arrays.
 */
CW.UnitTest._makeUneval = function _makeUneval() {
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	var protos = [];

	var char2esc = {
		'\t':'t', // tab
		'\n':'n', // newline
		'\f':'f', // form feed
		'\r':'r' // carriage return

		// short vertical tab isn't here because JScript doesn't support it, so we'll
		// pretend it doesn't exist in any browser, for consistency.
	};

	var escapeChar = function(c) {
		if (c in char2esc) {
			return '\\' + char2esc[c];
		}
		var ord = c.charCodeAt(0);
		// The choice is to use \x escapes, and to uppercase the hex,
		// is based on .toSource() behavior in Firefox.
		if(ord < 0x10) {
			return '\\x0' + ord.toString(16).toUpperCase();
		} else if(ord < 0x20) {
			return '\\x' + ord.toString(16).toUpperCase();
		} else if(ord < 0x7F) {
			// Because this character is in the visible character range,
			// and we were asked to escape it anyway, just backslash it.
			return '\\' + c;
		} else if(ord < 0x100) {
			return '\\x' + ord.toString(16).toUpperCase();
		} else if(ord < 0x1000) {
			return '\\u0' + ord.toString(16).toUpperCase();
		} else {
			return '\\u'  + ord.toString(16).toUpperCase();
		}
	};

	var uneval_asIs = function(o) {
		return o.toString();
	};

	// predefine for objects where typeof(o) != 'object'
	var name2uneval = {
		'boolean': uneval_asIs,
		'number': uneval_asIs,
		'string': function(o){
			// regex is: control characters, double quote, backslash,
			return '\"' + o.toString().replace(/[\x00-\x1F\"\\\u007F-\uFFFF]/g, escapeChar) + '\"';
		},
		'undefined': function(o){
			return 'undefined';
		},
		'function': uneval_asIs
	};

	var uneval_default = function(o, noParens) {
		var src = []; // a-ha!
		for (var p in o){
			if (!hasOwnProperty.call(o, p)) {
				continue;
			}
			src.push(uneval(p, /*noParens*/true)  + ':' + uneval(o[p], /*noParens*/true));
		};
		// parens are only used for the outer-most object.
		if(noParens) {
			return '{' + src.toString() + '}';
		} else {
			return '({' + src.toString() + '})';
		}
	};

	var uneval_set = function(proto, name, func) {
		protos.push([proto, name]);
		name2uneval[name] = func || uneval_default;
	};

	uneval_set(Array, 'array', function(o) {
		var src = [];
		for (var i = 0, l = o.length; i < l; i++) {
			src[i] = uneval(o[i], /*noParens*/true);
		}
		return '[' + src.toString() + ']';
	});

	uneval_set(RegExp, 'regexp', uneval_asIs);

	uneval_set(Date, 'date', function(o) {
		return '(new Date(' + o.valueOf() + '))';
	});

	var typeName = function(o) {
		var t = typeof o;
		if (t != 'object') {
			return t;
		}
		// we have to linear-search. sigh.
		for (var i = 0, l = protos.length; i < l; i++){
			if (o instanceof protos[i][0]) {
				return protos[i][1];
			}
		}
		return 'object';
	};

	var uneval = function(o, noParens) {
		// if (o.toSource) return o.toSource(); // a bad idea, but maybe useful for comparison

		// null is of type "object", so short-circuit
		if (o === null) {
			return 'null';
		}
		var func = name2uneval[typeName(o)] || uneval_default;
		return func(o, noParens);
	}

	return uneval;
}

CW.UnitTest.repr = CW.UnitTest._makeUneval();


/**
 * Return the stack limit of the current environment.
 *
 * If over 1000, just return 1000.
 */
CW.UnitTest.calculateStackLimit = function(n) {
	if(n === undefined) {
		n = 0;
	}
	// Opera stops executing JavaScript when you blow the stack.
	// All other known browsers raise an exception.
	if(goog.userAgent.OPERA || n >= 1000) {
		return 1000; // In Opera 10.10, it's actually 5000, but return 1000 for consistency.
	}
	try {
		return CW.UnitTest.calculateStackLimit(n+1);
	} catch(e) {
		return n;
	}
}


CW.UnitTest.estimatedStackLimit = CW.UnitTest.calculateStackLimit();



/**
 * A visit-controller which applies a specified visitor to the methods of a
 * suite, waiting for the Deferred from a visit to fire before proceeding to
 * the next method.
 */
CW.Class.subclass(CW.UnitTest, 'SerialVisitor').methods(
	function traverse(self, visitor, tests) {
//		CW.UnitTest.logger.fine('Using SerialVisitor on ' + tests);
		var completionDeferred = new goog.async.Deferred();
		self._traverse(visitor, tests, completionDeferred, 0);
		return completionDeferred;
	},

	function _traverse(self, visitor, tests, completionDeferred, nowOn) {
		var result, testCase;

		// Some browsers (maybe just IE6 x64) have a very low stack limit. If we estimate that
		// we might blow the stack limit, avoid calling into the next test case synchronously.

		// TODO: maybe a better estimate that takes into account how many tests there are.
		// Keep in mind that IE6 x64 claims a stack limit of 129 but it might be lower in practice,
		// so you'll have to do it right.
		var syncCallOkay = CW.UnitTest.estimatedStackLimit > 800;

		if (nowOn < tests.length) {
			testCase = tests[nowOn];
			result = testCase.visit(visitor);
			result.addCallback(function(ignored) {
				if(syncCallOkay) {
					self._traverse(visitor, tests, completionDeferred, nowOn + 1);
				} else {
					goog.global.setTimeout(function(){
						self._traverse(visitor, tests, completionDeferred, nowOn + 1);
					}, 0);
				}
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

			// synchronous version (not safe for all browsers)
			//// completionDeferred.callback(null);

			// asynchronous version
			setTimeout(
				function _SerialVisitor_fire_completionDeferred(){
					completionDeferred.callback(null);
				},
			0);
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
//CW.Class.subclass(CW.UnitTest, 'SerialVisitor').methods(
//	function traverse(self, visitor, tests) {
//		self.runTestNum = tests.length;
//		var completionDeferred = new goog.async.Deferred();
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
CW.Class.subclass(CW.UnitTest, 'SynchronousVisitor').methods(
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
CW.UnitTest.stopTrackingDelayedCalls = function stopTrackingDelayedCalls() {
	CW.UnitTest.delayedCalls = {
		'setTimeout_pending': {},
		'setInterval_pending': {}
	};
};


// Initialize the objects
CW.UnitTest.stopTrackingDelayedCalls();


// TODO: maybe generalize Timeout and Interval monkeys? with a monkeyMaker?


CW.UnitTest.setTimeoutMonkey = function(callable, when) {
	function replacementCallable(ticket) {
		delete CW.UnitTest.delayedCalls['setTimeout_pending'][ticket];

		// not very useful message, because test runner knows exactly which test caused the problem in the first place.
//		if(originalLen !== newLen + 1) {
//			CW.UnitTest.logger.fine('{MONKEY} replacementCallable did no cleanup because setTimeout callable ran *after* the test runner already cleaned the delayedCalls.');
//		}

		// actually run the callable
		callable.apply(null, []);
	}

	var ticket = null;

	if(window.__CW_setTimeout_bak) {
		ticket = __CW_setTimeout_bak(
			function _setTimeoutMonkey_replacementCallable_bak(){ replacementCallable(ticket) },
		when);
	} else if(window.frames && window.frames[0] && window.frames[0].setTimeout) {
		ticket = window.frames[0].setTimeout(
			function _setTimeoutMonkey_replacementCallable_frame(){ replacementCallable(ticket) },
		when);
	} else {
		throw new Error("neither setTimeout_bak nor window.frames[0].setTimeout was available.");
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
	} else if(window.frames && window.frames[0] && window.frames[0].setInterval) {
		ticket = window.frames[0].setInterval(callable, when);
	} else {
		throw new Error("neither setInterval_bak nor window.frames[0].setInterval was available.");
	}

	CW.UnitTest.delayedCalls['setInterval_pending'][ticket] = 1;

	return ticket;
}



CW.UnitTest.clearTimeoutMonkey = function(ticket) {

	var output = null;

	if(window.__CW_clearTimeout_bak) {
		output = __CW_clearTimeout_bak(ticket);
	} else if(window.frames && window.frames[0] && window.frames[0].clearTimeout) {
		output = window.frames[0].clearTimeout(ticket);
	} else {
		throw new Error("neither clearTimeout_bak nor window.frames[0].clearTimeout was available.");
	}

	delete CW.UnitTest.delayedCalls['setTimeout_pending'][ticket];
	return output;
}



CW.UnitTest.clearIntervalMonkey = function(ticket) {

	var output = null;

	if(window.__CW_clearInterval_bak) {
		output = __CW_clearInterval_bak(ticket);
	} else if(window.frames && window.frames[0] && window.frames[0].clearInterval) {
		output = window.frames[0].clearInterval(ticket);
	} else {
		throw new Error("neither __CW_clearInterval_bak nor window.frames[0].clearInterval was available.");
	}

	delete CW.UnitTest.delayedCalls['setInterval_pending'][ticket];
	return output;
}


/**
 * This needs to be called before tests are started.
 */
CW.UnitTest.installMonkeys = function installMonkeys() {
	//CW.UnitTest.logger.fine('installMonkeys');

	var installD = new goog.async.Deferred();

	if(CW.UnitTest.monkeysAreInstalled) {
		//CW.UnitTest.logger.fine('Monkeys already installed or being installed.');
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
		CW.UnitTest._iframeReady = new goog.async.Deferred();

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
		iframe.attachEvent("onload", function _UnitTest_fire__iframeReady(){
			CW.UnitTest._iframeReady.callback(null);
		});

		// setAttribute("style", ...  is not working in IE6 or IE7, so use .style instead.
		iframe.style.height = '16px';
		iframe.style.border = '3px';

		body.appendChild(iframe);

		var numFrames = window.frames.length;
		if(numFrames != 1) {
			throw new Error("window.frames.length was " + numFrames);
		}

		function _IE_finishInstallMonkeys() {
			CW.UnitTest.logger.info('_iframeReady triggered.');
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


/**
 * Return the `uniq' array for C{a}. The returned array will be shorter, or
 * the same size. The returned array will always be sorted.
 *
 * This implementation doesn't add the array elements to an object
 * to check uniqueness, so it works with any mixture of types.
 *
 * @type a: array object
 * @param a: array of items to "uniq"
 *
 * @rtype: array object
 * @return: the uniq'ed array.
 */
CW.UnitTest.uniqArray = function uniqArray(a) {
	// Because JavaScript's Array.prototype.sort ignores types, it doesn't actually work. Observe:
	// >>> a = [3, 3, 2, 0, -2, '2', '3', 3, '3', '3', 3, 3, 3, '3', 3, '3', 3, 3.0, 3.0]
	// >>> a.sort()
	// [-2, 0, 2, "2", 3, 3, "3", 3, "3", "3", 3, 3, 3, "3", 3, "3", 3, 3, 3]

	// So, we use a custom sort function that compares the 'typeof' value too, and probably
	// works most of the time. Note that this custom sort function probably might ruin
	// a default "in-place" sort (though ECMA-262 3rd edition does not guarantee in-place sort.)
	// Hopefully jumping through these hoops is better than just going for an O(N^2) uniq.

	var sorted = a.slice(0).sort(function(a, b){
		return [typeof a, a] < [typeof b, b] ? -1 : 1;
	});
	var newArray = [];
	for (var i = 0; i < sorted.length; i++) {
		if (i === 0 || sorted[i - 1] !== sorted[i]) {
			newArray.push(sorted[i]);
		}
	}
	return newArray;
}



CW.Class.subclass(CW.UnitTest, 'ClockAdvanceError');


/**
 * Provide a deterministic, easily-controlled browser C{window}.
 * This is commonly useful for writing deterministic unit tests for code which
 * schedules events with C{setTimeout}, C{setInterval}, C{clearTimeout},
 * and {clearInterval}.
 *
 * Note that this does not mimic browser deficiencies in C{setTimeout} and
 * C{setInterval}. For example, the C{1} in C{setTimeout(callable, 1)} will not
 * be raised to C{13}.
 *
 * Note: we must use .pmethods instead of .methods here, because IE leaks
 * named functions into the outer scope, and we really can't deal with that here,
 * because the function names are "setTimeout" and so on.
 */
CW.Class.subclass(CW.UnitTest, 'Clock').pmethods({

	__init__: function() {
		var self = this;
		self._rightNow = 0.0;
		self._counter = -1;
		self._calls = [];

		/**
		 * A deterministic Date object that works sort of like a standard
		 * C{window.Date}.
		 */
		self.Date = function _UnitTest_Clock_Date() {

		}

		/**
		 * @rtype: C{Number}
		 * @return: "Milliseconds since epoch", except deterministic and
		 *    probably close to zero.
		 */
		self.Date.prototype.getTime = function getTime() {
			return self._rightNow;
		}

		// TODO: more Date functions, in case anything needs them.
		// The general strategy to implement `someMethod' would be:
		//    return new Date(self._RightNow).someMethod();
	},


	_addCall: function(call) {
		var self = this;
		self._calls.push(call);
		self._sortCalls();
	},


	_sortCalls: function() {
		var self = this;
		self._calls.sort(function(a, b) {
			if(a.runAt == b.runAt) {
				return 0;
			} else {
				return a.runAt < b.runAt ? -1 : 1;
			}
		});
	},


	/**
	 * @type callable: function or callable host object
       * @param callable: the callable to call soon
	 *
	 * @type when: Number
       * @param when: when to call C{callable}, in milliseconds. 
	 *
	 * @rtype: C{Number} (non-negative integer)
	 * @return: The ticket number for the added event.
	 */
	setTimeout: function(callable, when) {
		var self = this;
		self._addCall({
			ticket: ++self._counter,
			runAt: self._rightNow + when,
			callable: callable,
			respawn: false
		});
		return self._counter;
	},


	/**
	 * @type callable: function or callable host object
       * @param callable: the callable to call (possibly repeatedly)
	 *
	 * @type interval: Number
       * @param interval: delay between calls to C{callable}, in milliseconds.
	 *    If you specify 0, the next call to C{advance} will result in an
	 *    infinite loop.
	 *
	 * @rtype: C{Number} (non-negative integer)
	 * @return: The ticket number for the added event.
	 */
	setInterval: function(callable, interval) {
		var self = this;
		self._addCall({
			ticket: ++self._counter,
			runAt: self._rightNow + interval,
			callable: callable,
			respawn: true,
			interval: interval
		});
		return self._counter;
	},


	// For the unit tests.
	_countPendingEvents: function() {
		var self = this;
		return self._calls.length;
	},


	// For the unit tests.
	_isTicketInEvents: function(ticket) {
		var self = this;
		var haveIt = false;
		var n = self._calls.length;
		while(n--) {
			var call = self._calls[n];
			if(call.ticket === ticket) {
				haveIt = true;
			}
		}
		return haveIt;
	},


	/**
	 * Notes: in both Firefox 3.5.3 and IE8, you can successfully clearTimeout() an interval,
	 * and clearInterval() a timeout, so here we don't check the timeout/interval type.
	 */
	_clearAnything: function(ticket) {
		var self = this;
		var n = self._calls.length;
		while(n--) {
			var call = self._calls[n];
			if(call.ticket === ticket) {
				var ret = self._calls.splice(n, 1);
				goog.asserts.assert(ret[0].ticket === ticket, ret[0].ticket + " !== " + ticket);
				break;
			}
		}
		return undefined;
	},


	/**
	 * @type ticket: Number
       * @param ticket: the ticket number of the timeout/interval to clear.
	 *
	 * @return: undefined
	 */
	clearTimeout: function(ticket) {
		var self = this;
		return self._clearAnything(ticket);
	},


	/**
	 * @type ticket: Number
       * @param ticket: the ticket number of the timeout/interval to clear.
	 *
	 * @return: undefined
	 */
	clearInterval: function(ticket) {
		var self = this;
		return self._clearAnything(ticket);
	},


	/**
	 * Move time on this clock forward by the given amount and run whatever
	 * pending calls should be run.
	 *
	 * If a callable throws an error, no more callables will be called. But if you
	 * C{advance()} again, they will.
	 *
	 * @type amount: C{Number} (positive integer or non-integer, but not
	 *    NaN or Infinity)
	 * @param amount: The number of seconds which to advance this clock's time.
 	 */
	advance: function(amount) {
		// Remember that callables can re-entrantly call advance(...), as
		// well as add or clear timeouts/intervals. Don't try stupid optimization
		// tricks.

		var self = this;

		if(amount < 0) {
			throw new CW.UnitTest.ClockAdvanceError("amount was "+amount+", should have been > 0");
		}

		self._rightNow += amount;

		for(;;) {
			//console.log('_calls: ', CW.UnitTest.repr(self._calls), '_rightNow: ', self._rightNow);
			if(self._calls.length === 0 || self._calls[0].runAt > self._rightNow) {
				break;
			}
			var call = self._calls.shift();

			// If it needs to be respawned, do it now, before calling the callable,
			// because the callable may raise an exception. Also because the
			// callable may want to clear its own interval.
			if(call.respawn === true) {
				call.runAt += call.interval;
				self._addCall(call);
			}

			// Make sure `this' is the global object for callable (making `this'
			// "worthless" like it is when the real setTimeout calls you.) Note that
			// for callable, `this' becomes `window', not `null'.
			call.callable.apply(null, []);
		}
	}

	// TODO: maybe implement and test pump, if needed

//	def pump(self, timings):
//		"""
//		Advance incrementally by the given set of times.
//
//		@type timings: iterable of C{float}
//		"""
//		for amount in timings:
//			self.advance(amount)

});


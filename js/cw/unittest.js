/**
 * @fileoverview JavaScript unit testing framework with Deferred support,
 * 	inspired by Twisted Trial.
 *
 * This is based on Divmod UnitTest.js. It was heavily modified to:
 *
 * 	- support in-browser testing, rather than just SpiderMonkey/subunit.
 *
 * 	- add support for Deferreds in test methods, setUp, and tearDown.
 * 		After a returned Deferred fires, the test runner resumes testing.
 * 		This works just as in Trial.
 *
 * 	- track setTimeout/setInterval calls and blow up if they outlive a test.
 * 		This is analogous to making sure the reactor (in Twisted) is clean after the test.
 *
 *	- a counter to track which assertion is being run, to make it easy to find
 * 		the failing assertion when the environment does not provide the line
 * 		number.
 *
 *	- many more assertions, including assertEqual and assertFailure.
 *
 * 	- general Closure-ization
 */

goog.provide('cw.UnitTest');

goog.require('cw.Class');
goog.require('goog.array');
goog.require('goog.object');
goog.require('goog.userAgent');
goog.require('goog.asserts');
goog.require('goog.testing.stacktrace');
goog.require('goog.async.Deferred');
goog.require('goog.async.DeferredList');
goog.require('goog.debug');
goog.require('goog.debug.Logger');
goog.require('goog.debug.Error');
goog.require('goog.debug.Console'); // needed for TestRunnerPage
goog.require('goog.debug.HtmlFormatter'); // needed for TestRunnerPage
goog.require('goog.string');


// anti-clobbering for JScript
(function(){


cw.UnitTest.logger = goog.debug.Logger.getLogger('cw.UnitTest');
cw.UnitTest.logger.setLevel(goog.debug.Logger.Level.ALL);


/**
 * @return {!cw.UnitTest.TestSuite} A suite which contains every test
 * defined in C{testClass}. Assumes that if a method name starts with
 * C{test_}, then it is a test.
 */
cw.UnitTest.loadFromClass = function(testClass) {
	var prefix = 'test_';
	var suite = new cw.UnitTest.TestSuite();
	var methods = goog.object.getKeys(testClass.prototype).sort();
	for (var i = 0; i < methods.length; ++i) {
		var name = methods[i];
		if (goog.string.startsWith(name, prefix)) {
			suite.addTest(testClass(name));
		}
	}
	return suite;
};


/**
 * @param {!Object} klass
 *
 * @return {boolean} Whether {@code klass} is a subclass of
 * {@code cw.UnitTest.TestCase}.
 */
cw.UnitTest.isTestCaseClass = function(klass) {
	if (klass.subclassOf === undefined) {
		return false;
	}
	if(!klass.subclassOf(cw.UnitTest.TestCase)) {
		return false;
	}
	return true;
};


/**
 * @param {!Object} klass
 *
 * @return {boolean} Whether {@code klass} is a subclass of
 * {@code cw.UnitTest.TestCase} and its name does not start
 * with "_".
 */
cw.UnitTest.isRunnableTestCaseClass = function(klass) {
	if(!cw.UnitTest.isTestCaseClass(klass)) {
		return false;
	}
	// JavaScript has no multiple inheritance, which makes defining
	// a "base class" with tests, and then defining a real test case
	// that subclasses (BaseTestClass, cw.UnitTest.TestCase) impossible.
	// So, we implement this primitive system that avoids running TestCase
	// subclasses that start with "_".
	var namePieces = klass.__name__.split('.');
	var lastPiece = namePieces[namePieces.length - 1];
	if (lastPiece.substr(0, 1) == '_') {
		cw.UnitTest.logger.info('cw.UnitTest.isRunnableTestCaseClass: ' +
			'assuming ' + klass + ' is not a runnable TestCase class.');
		return false;
	}
	return true;
};


/**
 * @param {!Object} testModule
 *
 * @return {!cw.UnitTest.TestSuite} a suite which contains every test
 * 	defined in {@code testModule}.
 */
cw.UnitTest.loadFromModule = function(testModule) {
	var suite = new cw.UnitTest.TestSuite();
	for (var name in testModule) {
		if (cw.UnitTest.isRunnableTestCaseClass(testModule[name])) {
			suite.addTest(cw.UnitTest.loadFromClass(testModule[name]));
		}
	}
	return suite;
};



/**
 * @param {!Array.<!Object>} testModules
 *
 * @return {!cw.UnitTest.TestSuite} a suite which contains every test
 * 	in every module in array {@code testModules}
 */
cw.UnitTest.loadFromModules = function(testModules) {
	var suite = new cw.UnitTest.TestSuite();
	for (var i in testModules) {
		var testModule = testModules[i];
		for (var name in testModule) {
			if (cw.UnitTest.isRunnableTestCaseClass(testModule[name])) {
				suite.addTest(cw.UnitTest.loadFromClass(testModule[name]));
			}
		}
	}
	return suite;
};


/**
 * Raised to indicate that a test has failed.
 *
 * @param {string} msg Reason why the test failed.
 * @constructor
 * @extends {goog.debug.Error}
 */
cw.UnitTest.AssertionError = function(msg) {
	goog.debug.Error.call(this, msg);
	this.stack = goog.testing.stacktrace.canonicalize(this.stack);
};
goog.inherits(cw.UnitTest.AssertionError, goog.debug.Error);
cw.UnitTest.AssertionError.prototype.name = 'cw.UnitTest.AssertionError';

cw.UnitTest.AssertionError.prototype.toString = function() {
	return this.message + (this.stack ? '\n' + this.stack : '');
}


/**
 * Error wrapper for tests that have errored.
 *
 * @param {string} msg Error message
 * @constructor
 * @extends {goog.debug.Error}
 */
cw.UnitTest.TestError = function(msg) {
	goog.debug.Error.call(this, msg);
	this.stack = goog.testing.stacktrace.canonicalize(this.stack);
};
goog.inherits(cw.UnitTest.TestError, goog.debug.Error);
cw.UnitTest.TestError.prototype.name = 'cw.UnitTest.TestError';

cw.UnitTest.TestError.prototype.toString = function() {
	return this.message + (this.stack ? '\n' + this.stack : '');
}


/**
 * Raised to indicate that a test is being skipped.
 *
 * @param {string} msg Reason why the test is being skipped.
 * @constructor
 * @extends {goog.debug.Error}
 */
cw.UnitTest.SkipTest = function(msg) {
	goog.debug.Error.call(this, msg);
};
goog.inherits(cw.UnitTest.SkipTest, goog.debug.Error);
cw.UnitTest.SkipTest.prototype.name = 'cw.UnitTest.SkipTest';


cw.UnitTest.browserAddsCrapToErrorMessages = (
	goog.userAgent.OPERA && !goog.userAgent.isVersion('10.50'));



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
 * @type failures: Array of [L{TestCase}, L{cw.UnitTest.AssertionError}] pairs
 * @ivar failures: The assertion failures that have occurred in this test run,
 *				 paired with the tests that generated them.
 *
 * @type errors: Array of [L{TestCase}, L{Error}] pairs
 * @ivar errors: The errors that were raised by tests in this test run, paired
 *			   with the tests that generated them.
 *
 * @type skips: Array of [L{TestCase}, L{cw.UnitTest.SkipTest}] pairs
 * @ivar skips: The SkipTest exceptions that were raised by tests in this test run,
 * 				paired with the tests that generated them.
 *
 * @constructor
 */
cw.Class.subclass(cw.UnitTest, 'TestResult').methods(
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
	 * @type test: L{cw.UnitTest.TestCase}
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
	 * @type test: L{cw.UnitTest.TestCase}
	 */
	function stopTest(self, test) {
	},


	/**
	 * Report an error that occurred while running the given test.
	 *
	 * @param test: The test that had an error.
	 * @type test: L{cw.UnitTest.TestCase}
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
	 * @type test: L{cw.UnitTest.TestCase}
	 *
	 * @param error: The failure that occurred.
	 * @type error: A L{cw.UnitTest.AssertionError} instance.
	 */
	function addFailure(self, test, error) {
		self.failures.push([test, error]);
	},


	/**
	 * Report a skipped test.
	 *
	 * @param test: The test that was skipped.
	 * @type test: L{cw.UnitTest.TestCase}
	 *
	 * @param error: The SkipTest exception that occurred.
	 * @type error: A L{cw.UnitTest.SkipTest} instance.
	 */
	function addSkip(self, test, error) {
		self.skips.push([test, error]);
	},


	/**
	 * Report that the given test succeeded.
	 *
	 * @param test: The test that succeeded.
	 * @type test: L{cw.UnitTest.TestCase}
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
 *
 * @constructor
 */
cw.UnitTest.TestResult.subclass(cw.UnitTest, 'DIVTestResult').methods(
	function __init__(self, div) {
		cw.UnitTest.DIVTestResult.upcall(self, '__init__', []);
		self._div = div;
	},


	function startTest(self, test) {
		cw.UnitTest.DIVTestResult.upcall(self, 'startTest', [test]);
		var textnode = document.createTextNode(test.id());
		self._div.appendChild(textnode);
	},


	function addError(self, test, error) {
		//console.log(error);
		cw.UnitTest.DIVTestResult.upcall(self, 'addError', [test, error]);
		var br = document.createElement("br");
		var textnode = document.createTextNode('... ERROR');
		var pre = document.createElement("pre");
		pre.innerHTML = error.toString();
		self._div.appendChild(textnode);
		self._div.appendChild(br);
		self._div.appendChild(pre);

	},


	function addFailure(self, test, error) {
		cw.UnitTest.DIVTestResult.upcall(self, 'addFailure', [test, error]);
		var br = document.createElement("br");
		var textnode = document.createTextNode('... FAILURE');
		var pre = document.createElement("pre");
		pre.innerHTML = error.toString();
		self._div.appendChild(textnode);
		self._div.appendChild(br);
		self._div.appendChild(pre);
		//self._div.appendChild(failure.toPrettyNode());
	},


	function addSkip(self, test, error) {
		cw.UnitTest.DIVTestResult.upcall(self, 'addSkip', [test, error]);
		var br = document.createElement("br");
		var textnode = document.createTextNode('... SKIP: ' + error.message);
		self._div.appendChild(textnode);
		self._div.appendChild(br);
		//self._div.appendChild(skip.toPrettyNode());
	},


	function addSuccess(self, test) {
		cw.UnitTest.DIVTestResult.upcall(self, 'addSuccess', [test]);
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
 *
 * @constructor
 */
cw.UnitTest.TestResult.subclass(cw.UnitTest, 'ConsoleTestResult').methods(
	function __init__(self) {
		cw.UnitTest.ConsoleTestResult.upcall(self, '__init__', []);
	},


	function startTest(self, test) {
		cw.UnitTest.ConsoleTestResult.upcall(self, 'startTest', [test]);
		print(test.id());
	},


	function addError(self, test, error) {
		cw.UnitTest.ConsoleTestResult.upcall(self, 'addError', [test, error]);
		print('... ERROR\n');
		print('\n' + error.toString() + '\n\n');
	},


	function addFailure(self, test, failure) {
		cw.UnitTest.ConsoleTestResult.upcall(self, 'addFailure', [test, failure]);
		print('... FAILURE\n');
		print('\n' + failure.toString() + '\n\n');
	},


	function addSkip(self, test, skip) {
		cw.UnitTest.ConsoleTestResult.upcall(self, 'addSkip', [test, skip]);
		print('... SKIP\n');
		print('\n' + skip.toString() + '\n\n');
	},


	function addSuccess(self, test) {
		cw.UnitTest.ConsoleTestResult.upcall(self, 'addSuccess', [test]);
		print('... OK\n');
	}
);




// no more subunit/spidermonkey
/*
cw.UnitTest.TestResult.subclass(cw.UnitTest, 'SubunitTestClient').methods(
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

	function addFailure(self, test, error) {
		self._write("failure: " + test.id() + " [");
		self._sendException(error);
		self._write(']');
	},

	// TODO: needs addSkip if re-enabled

	function addSuccess(self, test) {
		self._write('successful: ' + test.id());
	},

	function startTest(self, test) {
		self._write('test: ' + test.id());
	});
*/


/**
 * Represents a collection of tests. Implements the Composite pattern.
 *
 * @constructor
 */
cw.Class.subclass(cw.UnitTest, 'TestSuite').methods(
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
	 * @type test: L{cw.UnitTest.TestCase} or L{cw.UnitTest.TestSuite}
	 */
	function addTest(self, test) {
		self.tests.push(test);
	},


	/**
	 * Add the given tests to the suite.
	 *
	 * @param tests: An array of tests to add.
	 * @type tests: [L{cw.UnitTest.TestCase} or L{cw.UnitTest.TestSuite}]
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

		var countVisitor = cw.UnitTest.SynchronousVisitor();
		countVisitor.traverse(visitor, self.tests);

		return total;
	},


	/**
	 * Visit each test case in this suite with the given visitor function.
	 */
	function visit(self, visitor) {
		// safari has serious maximum recursion problems
		var sVisitor = cw.UnitTest.SerialVisitor();
		return sVisitor.traverse(visitor, self.tests);
	},


	/**
	 * Visit each test case in this suite with the given visitor function *synchronously*,
	 * ignoring any Deferreds.
	 *
	 * Useful for counting the # of tests and not much else.
	 */
	function visitSync(self, visitor) {
		var testVisitor = cw.UnitTest.SynchronousVisitor();
		testVisitor.traverse(visitor, self.tests);
	},



	/**
	 * Run all of the tests in the suite.
	 */
	function run(self, result) {
		var installD = cw.UnitTest.installMonkeys();

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
 * I will be instantiated once per your own test_ method, by L{cw.UnitTest.loadFromClass}.
 *
 * I know which asserts/compares are "internal" (called by my own logic) because:
 * some browsers don't have tracebacks in JS,
 * and user wants to know which assert/compare statement in the TestCase failed.
 *
 * To do this tracking, I assert the statement,
 * then increment the counter if the assert came directly
 * from the user's test_ method (and not of my own methods).
 *
 * @constructor
 */
cw.Class.subclass(cw.UnitTest, 'TestCase').methods(
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
	 * @param {string} reason Why the test is being failed.
	 * @return {cw.UnitTest.AssertionError}
	 */
	function getFailError(self, reason) {
		return new cw.UnitTest.AssertionError("[" + self._assertCounter + "] " + reason, []);
	},


	/**
	 * Fail the test. Equivalent to an invalid assertion.
	 *
	 * @param {string} reason Why the test is being failed.
	 */
	function fail(self, reason) {
		throw self.getFailError(reason);
	},


	/**
	 * Assert that the given value is truthy.
	 *
	 * @param {*} ok Any value.
	 * @param {string=} message An error message for the AssertionError.
	 */
	function assertTrue(self, ok, message, _internalCall /*=false*/) {
		if (!ok) {
			self.fail(message);
		}
		if(_internalCall !== true) {
			self._assertCounter += 1;
		}
	},


	/**
	 * Assert that the given value is falsy.
	 *
	 * @param {*} ok Any value.
	 * @param {string=} message An error message for the AssertionError.
	 */
	function assertFalse(self, ok, message, _internalCall /*=false*/) {
		if (ok) {
			self.fail(message);
		}
		if(_internalCall !== true) {
			self._assertCounter += 1;
		}
	},


	/**
	 * Used for marking a line that should never be reached.
	 * The idea comes from Closure Library's tests.
	 */
	function neverHappen(self) {
		self.fail("This line should never be reached.");
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
	 * @raises L{cw.UnitTest.AssertionError} if C{predicate} returns
	 * C{false}.
	 */
	function compare(self, predicate, description, a, b,
					 /*optional*/ message, /*optional*/ _internalCall /*=false*/) {
		var repr = cw.repr.repr;
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

		// If a === b, we don't need to dig through them. But if you somehow find an object
		// in JavaScriptland that ==='s successfully but isn't identical, you should remove
		// this short-circuit.
		if(a === b) {

		} else if(a === null || b === null) {
			// Because C{null} has typeof C{object} and may successfully iterate (though with 0 properties),
			// we need to catch it early and do a direct === comparison if either C{a} or C{b} are C{null}
			self.assertIdentical(a, b, message, true);

		} else if(goog.isArray(a) && goog.isArray(b)) {
			// This is a deep (recursive) comparison, unlike assertArraysEqual or goog.array.equals

			var i;
			var failMsg = goog.string.subs("Arrays %s != %s; original message: %s",
				cw.repr.repr(a), cw.repr.repr(b), message);
			// TODO: only repr() on error

			self.assertIdentical(a.length, b.length, failMsg, true);

			for (i in a) {
				self.assertIn(i, b, failMsg, true);
				self.assertEqual(a[i], b[i], failMsg, true);
			}
			for (i in b) {
				// We already checked for equality when we iterated over C{a}, so just
				// check that everything in C{b} is in C{a}
				self.assertIn(i, a, failMsg, true);
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
		if(!cw.UnitTest.browserAddsCrapToErrorMessages) {
			self.assertIdentical(errorMessage, expectedMessage,
				"Error was of wrong message: " + errorMessage, true);
		} else {
			self.assertTrue(
				goog.string.startsWith(errorMessage, expectedMessage),
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
			self.assertTrue(e instanceof expectedError,
						"Wrong error type thrown: " + e, true);
			if(expectedMessage !== undefined) {
				self.assertErrorMessage(e, expectedMessage, true);
			}
		}
		self.assertTrue(threw != null, "Callable threw no error", true);
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
	 *          a Deferred which will fire errback with a L{cw.UnitTest.AssertionError}.
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

		cw.UnitTest.logger.info('Starting ' + self + ' ' + self._methodName);

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
					if (anError instanceof cw.UnitTest.AssertionError) {
						result.addFailure(self, anError);
					} else if (anError instanceof cw.UnitTest.SkipTest) {
						result.addSkip(self, anError);
					} else {
						result.addError(self, new cw.UnitTest.TestError(anError.message));
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
							for(var pendingType in cw.UnitTest.delayedCalls) {
								for(var ticket in cw.UnitTest.delayedCalls[pendingType]) {
									cw.UnitTest.logger.severe(goog.string.subs("Leftover pending call: %s %s", pendingType, ticket));
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
								cw.UnitTest.stopTrackingDelayedCalls();
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
				if (anError instanceof cw.UnitTest.SkipTest) {
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
//			if (e instanceof cw.UnitTest.AssertionError) {
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
 * @param {!cw.UnitTest.TestResult} result A finished {@code TestResult}.
 *
 * @return {string} A nicely formatted summary for the given {@code TestResult}.
 */
cw.UnitTest.formatSummary = function(result) {
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
 * @param {!cw.UnitTest.TestResult} result A finished {@code TestResult}.
 *
 * @return {!Element} A DIV that contains an easily-recognizable image
 * 	(for humans and automated test systems), along with text describing
 * 	the number of tests run, errored, and failed.
 */
cw.UnitTest.makeSummaryDiv = function(result) {
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
 * to div {@code div}. After test completion, display a summary in the top-
 * right corner.
 *
 * @param {!(cw.UnitTest.TestCase|cw.UnitTest.TestSuite)} test The TestCase or
 * 	TestSuite to run.
 *
 * @return {!goog.async.Deferred} Deferred that fires after the summary
 * 	information is displayed.
 */
cw.UnitTest.runWeb = function(test, div) {
	var result = cw.UnitTest.DIVTestResult(div);
	var d = test.run(result);
	d.addCallback(function _UnitTest_after_run(){	
		var timeTaken = new Date().getTime() - result.timeStarted;

		var span = document.createElement('span');
		span.style.fontWeight = 'bold';
		var textnode = document.createTextNode(
			cw.UnitTest.formatSummary(result) + ' in ' + timeTaken + ' ms');
		span.appendChild(textnode);
		div.appendChild(span);

		div.appendChild(document.createElement('br'));

		var machineNode = document.createTextNode('|*BEGIN-SUMMARY*| ' + result.getSummary().join(',') + ' |*END-SUMMARY*|');
		div.appendChild(machineNode);

		var summaryDiv = cw.UnitTest.makeSummaryDiv(result);
		document.body.appendChild(summaryDiv);
	});
	return d;
};



/**
 * Run the given test, printing the summary of results and any errors
 * to the console, which must have a print statement in the global object.
 *
 * @param {!(cw.UnitTest.TestCase|cw.UnitTest.TestSuite)} test The TestCase or
 * 	TestSuite to run.
 *
 * @return {!goog.async.Deferred} Deferred that fires after the summary
 * 	information is displayed.
 */
cw.UnitTest.runConsole = function(test) {
	var result = cw.UnitTest.ConsoleTestResult();
	var d = test.run(result);
	d.addCallback(function _UnitTest_after_run(){
		var timeTaken = new Date().getTime() - result.timeStarted;

		print(cw.UnitTest.formatSummary(result) + ' in ' + timeTaken + ' ms\n');
		// If you forget the newline at the end of this line, Node.js will drop the line completely.
		print('|*BEGIN-SUMMARY*| ' + result.getSummary().join(',') + ' |*END-SUMMARY*|\n');
	});
	return d;
};




// no more subunit/spidermonkey
/*
cw.UnitTest.runRemote = function runRemote(test) {
	var result = cw.UnitTest.SubunitTestClient();
	test.run(result);
};*/



/**
 * @return {number} The stack limit of the current environment.
 * 	If over 1000, just return 1000.
 */
cw.UnitTest.calculateStackLimit = function(n) {
	if(n === undefined) {
		n = 0;
	}
	// Opera stops executing JavaScript when you blow the stack.
	// All other known browsers raise an exception.
	if(goog.userAgent.OPERA || n >= 1000) {
		return 1000; // In Opera 10.10, it's actually 5000, but return 1000 for consistency.
	}
	try {
		return cw.UnitTest.calculateStackLimit(n+1);
	} catch(e) {
		return n;
	}
}


cw.UnitTest.estimatedStackLimit = cw.UnitTest.calculateStackLimit();



/**
 * A visit-controller which applies a specified visitor to the methods of a
 * suite, waiting for the Deferred from a visit to fire before proceeding to
 * the next method.
 *
 * @constructor
 */
cw.Class.subclass(cw.UnitTest, 'SerialVisitor').methods(
	function traverse(self, visitor, tests) {
//		cw.UnitTest.logger.fine('Using SerialVisitor on ' + tests);
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
		var syncCallOkay = cw.UnitTest.estimatedStackLimit > 800;

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
			goog.global.setTimeout(
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
//cw.Class.subclass(cw.UnitTest, 'SerialVisitor').methods(
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
 *
 * @constructor
 */
cw.Class.subclass(cw.UnitTest, 'SynchronousVisitor').methods(
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
cw.UnitTest.stopTrackingDelayedCalls = function() {
	cw.UnitTest.delayedCalls = {
		'setTimeout_pending': {},
		'setInterval_pending': {}
	};
};


// Initialize the objects
cw.UnitTest.stopTrackingDelayedCalls();


/**
 * Install replacements for setTimeout, setInterval, clearTimeout,
 * and clearInterval. The replacements track any window-global
 * setTimeout/setInterval calls, and help you find if any scheduled calls
 * survived past the end of a test.
 *
 * This needs to be called before tests are started.
 *
 * Note: Closure Library also installs setTimeout/setInterval replacements,
 * 	mostly to catch and log errors. TODO: Investigate if our replacements
 * 	and Closure Library's replacements interfere with each other.
 */
cw.UnitTest.installMonkeys = function() {
	//cw.UnitTest.logger.fine('installMonkeys');

	// Deferred not really needed in this function ever since it was cleaned up
	var installD = new goog.async.Deferred();

	if(cw.UnitTest.monkeysAreInstalled) {
		//cw.UnitTest.logger.fine('Monkeys already installed or being installed.');
		installD.callback(null);
		return installD;
	}

	cw.UnitTest.monkeysAreInstalled = true;

	var originalSetTimeout = window.setTimeout;
	var originalSetInterval = window.setInterval;
	var originalClearTimeout = window.clearTimeout;
	var originalClearInterval = window.clearInterval;

	window.setTimeout = function(fn, time) {
		//cw.UnitTest.logger.finest('Inside replacement window.setTimeout. fn: ' + fn + ' ; time: ' + time);
		function replacementCallable(ticket) {
			delete cw.UnitTest.delayedCalls['setTimeout_pending'][ticket];

			// actually run the callable
			fn.apply(null, []);
		}

		if (originalSetTimeout.call) {
			var ticket = originalSetTimeout.call(this, function(){replacementCallable(ticket)}, time);
		} else {
			var ticket = originalSetTimeout(function(){replacementCallable(ticket)}, time);
		}

		cw.UnitTest.delayedCalls['setTimeout_pending'][ticket] = 1;

		return ticket;
	}

	window.setInterval = function(fn, time) {
		//cw.UnitTest.logger.finest('Inside replacement window.setInterval. fn: ' + fn + ' ; time: ' + time);
		// interval callable repeats forever until we clearInterval,
		// so we don't need any fancy replacementCallable.

		if (originalSetInterval.call) {
			var ticket = originalSetInterval.call(this, fn, time);
		} else {
			var ticket = originalSetInterval(fn, time);
		}
		cw.UnitTest.delayedCalls['setInterval_pending'][ticket] = 1;
		return ticket;
	}

	window.clearTimeout = function(ticket) {
		//cw.UnitTest.logger.finest('Inside replacement window.clearTimeout. ticket: ' + ticket);
		if (originalClearTimeout.call) {
			var output = originalClearTimeout.call(this, ticket);
		} else {
			var output = originalClearTimeout(ticket);
		}

		delete cw.UnitTest.delayedCalls['setTimeout_pending'][ticket];
		return output;
	}

	window.clearInterval = function(ticket) {
		//cw.UnitTest.logger.finest('Inside replacement window.clearInterval. ticket: ' + ticket);
		if (originalClearInterval.call) {
			var output = originalClearInterval.call(this, ticket);
		} else {
			var output = originalClearInterval(ticket);
		}

		delete cw.UnitTest.delayedCalls['setInterval_pending'][ticket];
		return output;
	}

	// In non-IE browsers, the above overrides everything correctly,
	// and both `setTimeout` and `window.setTimeout` use our special
	// function. But in IE6-IE8, just `setTimeout` still calls the original
	// browser function. So, we use execScript to override the "top-level"
	// `setTimeout` as well.

	// For unknown reasons, this is only needed for setTimeout,
	// and not setInterval, clearTimeout, or clearInterval.

	if(goog.userAgent.IE) {
		cw.UnitTest.__window_setTimeout = window.setTimeout;

		execScript("\
		function setTimeout(fn, callable) {\
			return cw.UnitTest.__window_setTimeout(fn, callable);\
		}", 'JavaScript');
	}

	installD.callback(null);
	return installD;
}


})(); // end anti-clobbering for JScript

/**
 * @fileoverview Tests for cw.UnitTest
 * 
 * Tests for cw.UnitTest's assertion functions are not here; they are in
 * 	{@code cw.Test.TestUnitTestAssertions}.
 */

goog.provide('cw.Test.TestUnitTest');

goog.require('cw.Class');
goog.require('cw.UnitTest');
goog.require('cw.Test.Mock');
goog.require('cw.Test.DMock');
goog.require('cw.Test.DSMock');
goog.require('goog.asserts.AssertionError');
goog.require('goog.async.Deferred');
goog.require('goog.async.DeferredList');


// anti-clobbering for JScript
(function(){


cw.UnitTest.TestCase.subclass(cw.Test.TestUnitTest, 'IsTestCaseTests').methods(
	/**
	 * Verify that L{isTestCaseClass} returns a positive result for L{TestCase}
	 * subclasses and a negative result for other types of object.
	 */
	function test_isTestCaseClass(self) {
		self.assertIdentical(
			true, cw.UnitTest.isTestCaseClass(
				cw.Test.TestUnitTestAssertions.AssertionTests));
		self.assertIdentical(
			false, cw.UnitTest.isTestCaseClass(
				cw.Test.TestUnitTestAssertions.AssertionTests()));
		self.assertIdentical(
			false, cw.UnitTest.isTestCaseClass(
				1));
	},


	/**
	 * Verify that L{isRunnableTestCaseClass} returns a positive result for
	 * L{TestCase} subclasses that don't start with "_" and a negative result
	 * for others.
	 */
	function test_isRunnableTestCaseClass(self) {
		// copy/paste from above; changed method name.
		self.assertIdentical(
			true, cw.UnitTest.isRunnableTestCaseClass(
				cw.Test.TestUnitTestAssertions.AssertionTests));
		self.assertIdentical(
			false, cw.UnitTest.isRunnableTestCaseClass(
				cw.Test.TestUnitTestAssertions.AssertionTests()));
		self.assertIdentical(
			false, cw.UnitTest.isRunnableTestCaseClass(
				1));

		self.assertIdentical(
			false, cw.UnitTest.isRunnableTestCaseClass(
				cw.Test.TestUnitTestAssertions._StartsWithUnderscore));
		self.assertIdentical(
			true, cw.UnitTest.isRunnableTestCaseClass(
				cw.Test.TestUnitTestAssertions.EndsWithUnderscore_));
	}
);


/**
 * A mock L{TestResult} object that we use to test that L{startTest} and L{stopTest}
 * are called appropriately.
 */
cw.Class.subclass(cw.Test.TestUnitTest, 'MockResult').methods(
	function __init__(self) {
		self.log = '';
	},

	function startTest(self, test) {
		self.log += 'startTest ' + test.id();
	},

	function addSuccess(self, test) {
		self.log += ' addSuccess ' + test.id();
	},

	function stopTest(self, test) {
		self.log += ' stopTest ' + test.id();
	}
);


/**
 * Tests for L{TestCase}.
 */
cw.UnitTest.TestCase.subclass(cw.Test.TestUnitTest, 'TestCaseTest').methods(
	function setUp(self) {
		self.result = cw.UnitTest.TestResult();
		self.mockModule = cw.Test.Mock;
	},

	/**
	 * Test that when a test is run, C{setUp} is called first, then the test
	 * method, then L{tearDown}.
	 */
	function test_wasRun(self) {
		var test = self.mockModule._WasRun("test_good");
		self.assertIdentical(test.log, '');
		var d = test.run(self.result);
		d.addCallback(function(){
			self.assertIdentical(test.log, 'setUp test tearDown');
		});
		return d;
	},

	/**
	 * Test that C{tearDown} still gets called, even when the test fails.
	 */
	function test_tearDownCalled(self) {
		var test = self.mockModule._WasRun("test_bad");
		var d = test.run(self.result);
		d.addCallback(function(){
			self.assertIdentical(test.log, 'setUp tearDown');
		});
		return d;
	},

	/**
	 * Test that C{run} takes a L{TestResult} that we can use to see whether
	 * the test passed.
	 */
	function test_goodResult(self) {
		var test = self.mockModule._WasRun('test_good');
		var d = test.run(self.result);
		d.addCallback(function(){
			self.assertArraysEqual(self.result.getSummary(), [1, 0, 0, 0]);
			self.assert(self.result.wasSuccessful());
		});
		return d;
	},


	/**
	 * Test that C{run} takes a L{TestResult} that we can use to see whether
	 * test test failed.
	 */
	function test_badResult(self) {
		var test = self.mockModule._WasRun('test_bad');
		var d = test.run(self.result);
		d.addCallback(function(){
			self.assertArraysEqual(self.result.getSummary(), [1, 1, 0, 0]);
			self.assert(!self.result.wasSuccessful());
		});
		return d;
	},


	/**
	 * Test that the L{TestResult} distinguishes between failed assertions
	 * and general errors.
	 */
	function test_errorResult(self) {
		var test = self.mockModule._WasRun('test_error');
		var d = test.run(self.result);
		d.addCallback(function(){
			self.assertArraysEqual(self.result.getSummary(), [1, 0, 1, 0]);
			self.assert(!self.result.wasSuccessful());
		});
		return d;
	},


	/**
	 * Test that we can find out which tests had which errors and which tests
	 * succeeded.
	 */
	function test_resultAccumulation(self) {
		var suite = cw.UnitTest.TestSuite();
		var bad = self.mockModule._WasRun('test_bad');
		var good = self.mockModule._WasRun('test_good');
		var error = self.mockModule._WasRun('test_error');
		var skip = self.mockModule._WasRun('test_skip');
		suite.addTests([bad, good, error, skip]);

		var d = suite.run(self.result);
		d.addCallback(function(){
			self.assertArraysEqual(self.result.getSummary(), [4, 1, 1, 1]);

			// check the failure
			self.assertIdentical(self.result.failures[0].length, 2);
			self.assertIdentical(self.result.failures[0][0], bad);
			self.assert(
				self.result.failures[0][1] instanceof goog.asserts.AssertionError,
				"self.result.failures[0][1] should have been a goog.asserts.AssertionError, not a: " + self.result.failures[0][1]);
			self.assertErrorMessage(self.result.failures[0][1], "[0] fail this test deliberately");

			// check the error
			self.assertIdentical(self.result.errors[0].length, 2);
			self.assertIdentical(self.result.errors[0][0], error);
			self.assert(
				self.result.errors[0][1] instanceof Error,
				"self.result.errors[0][1] should have been an Error, not a: " + self.result.errors[0][1]);

			// check the skip
			self.assertIdentical(self.result.skips[0].length, 2);
			self.assertIdentical(self.result.skips[0][0], skip);
			self.assert(
				self.result.skips[0][1] instanceof cw.UnitTest.SkipTest,
				"self.result.skips[0][1] should have been a cw.UnitTest.SkipTest, not a: " + self.result.skips[0][1]);

			self.assertErrorMessage(self.result.errors[0][1], "error");
			self.assertArraysEqual(self.result.successes, [good]);
		});
		return d;
	},


	/**
	 * Test that neither L{tearDown} nor the test method is called when
	 * L{setUp} fails.
	 */
	function test_failureInSetUp(self) {
		var test = self.mockModule._BadSetUp('test_method');
		self.assertIdentical(test.log, '');
		var d = test.run(self.result);
		d.addCallback(function(){
			self.assertIdentical(test.log, '');
		});
		return d;
	},


	/**
	 * Test that neither L{tearDown} nor the test method is called when
	 * L{setUp} throws L{cw.UnitTest.SkipTest}.
	 */
	function test_skipTestInSetUp(self) {
		var test = self.mockModule._SkipTestInSetUp('test_method');
		self.assertIdentical(test.log, '');
		var d = test.run(self.result);
		d.addCallback(function(){
			self.assertIdentical(test.log, '');
		});
		return d;
	},


	/**
	 * Test that failures in L{setUp} are reported to the L{TestResult}
	 * object.
	 */
	function test_failureInSetUpReported(self) {
		var test = self.mockModule._BadSetUp('test_method');
		var d = test.run(self.result);
		d.addCallback(function(){
			self.assertArraysEqual(self.result.getSummary(), [1, 0, 1, 0]);
		});
		return d;
	},


	/**
	 * Test that skips in L{setUp} are reported to the L{TestResult}
	 * object.
	 */
	function test_skipTestInSetUpReported(self) {
		var test = self.mockModule._SkipTestInSetUp('test_method');
		var d = test.run(self.result);
		d.addCallback(function(){
			self.assertArraysEqual(self.result.getSummary(), [1, 0, 0, 1]);
		});
		return d;
	},


	/**
	 * Test that failures in L{tearDown} are reported to the L{TestResult}
	 * object.
	 */
	function test_failureInTearDownReported(self) {
		var test = self.mockModule._BadTearDown('test_method');
		var d = test.run(self.result);
		d.addBoth(function(){
			self.assertArraysEqual(self.result.getSummary(), [1, 0, 1, 0]);
		});
		return d;
	},


	/**
	 * Test that a test which fails in L{tearDown} does *not* get added as
	 * a success.
	 */
	function test_badTearDownNotSuccess(self) {
		var test = self.mockModule._BadTearDown('test_method');
		var d = test.run(self.result);
		d.addBoth(function(){
			self.assertIdentical(self.result.successes.length, 0);
		});
		return d;
	},


	/**
	 * Test that L{TestCase.run} calls L{TestResult.startTest} and
	 * L{TestResult.stopTest}.
	 */
	function test_startAndStopTest(self) {
		var test = self.mockModule._WasRun('test_good');
		var id = test.id();
		var result = cw.Test.TestUnitTest.MockResult();
		var d = test.run(result);
		d.addCallback(function(){
			self.assertIdentical(
				result.log,
				'startTest ' + id + ' addSuccess ' + id + ' stopTest ' + id);
		});
		return d;
	},


	/**
	 * Test that we can create a L{TestSuite}, add tests to it, run it and
	 * get the results of all of the tests.
	 */
	function test_testSuite(self) {
		var suite = cw.UnitTest.TestSuite();
		suite.addTest(self.mockModule._WasRun('test_good'));
		suite.addTest(self.mockModule._WasRun('test_bad'));

		var d = suite.run(self.result);
		d.addCallback(function(){
			self.assertArraysEqual(self.result.getSummary(), [2, 1, 0, 0]);
			self.assert(!self.result.wasSuccessful());
		});
		return d;
	},


	/**
	 * Check that C{countTestCases} returns 0 for an empty suite, 1 for a test,
	 * and n for a suite with n tests.
	 */
	function test_countTestCases(self) {
		self.assertIdentical(self.countTestCases(), 1);
		var suite = cw.UnitTest.TestSuite();
		self.assertIdentical(suite.countTestCases(), 0);
		suite.addTest(self);
		self.assertIdentical(suite.countTestCases(), 1);
		suite.addTest(self.mockModule._WasRun('good'));
		self.assertIdentical(suite.countTestCases(), 2);
	},


	/**
	 * Test that C{id} returns the fully-qualified name of the test.
	 */
	function test_id(self) {
		var test = self.mockModule._WasRun('test_good');
		self.assertIdentical(test.id(), self.mockModule.__name__ + '._WasRun.test_good');
	},


	/**
	 * Test that C{visitSync} calls the visitor with the test case.
	 */
	function test_visitCase(self) {
		var log = [];
		function visitor(test) {
			log.push(test);
		}
		self.visitSync(visitor);

		self.assertArraysEqual(log, [self]);
	},


	/**
	 * Test that C{visit} calls the visitor for each test case in a suite.
	 *
	 * Tests *MUST* be run in linear, first->last order for this to pass.
	 * Don't try reversing the test execution or doing anything funny.
	 *
	 * This test could be improved with set() or something similar to make it pass
	 * even when tests are run in a strange order.
	 */
	function test_visitSuite(self) {
		var originalSelf = self;

		var log = [];
		function visitor(test) {
			log.push(test);

			// this is needed here because we're testing the async visit() and this is the only visitor
			// for the async visit() that doesn't natively return a Deferred.
			return goog.async.Deferred.succeed(null);
		}
		var d = cw.UnitTest.TestSuite().visit(visitor);

		d.addCallback(function(){
			self.assertArraysEqual(log, []);
			var tests = [self.mockModule._WasRun('test_good1'), self.mockModule._WasRun('test_good2')];
			var suite = cw.UnitTest.TestSuite(tests);

			var d2 = suite.visit(visitor);
			d2.addCallback(function(){
				self.assertArraysEqual(log, tests);
			});

			return d2;
		});

		return d;
	},


	/**
	 * Check that issubclass returns true when the first parameter is a subclass
	 * of the second, and false otherwise.
	 */
	function test_issubclass(self) {
		self.assert(
			self.__class__.subclassOf(self.__class__),
			"Thing should subclass itself");
		self.assert(self.__class__.subclassOf(cw.UnitTest.TestCase));
		self.assert(!cw.UnitTest.TestCase.subclassOf(self.__class__));
	}
);



cw.Test.TestUnitTest.TestCaseTest.subclass(cw.Test.TestUnitTest, 'TestCaseTestD').methods(
	function setUp(self) {
		self.__class__.upcall(self, 'setUp', []);
		self.mockModule = cw.Test.DMock;
	}
);



cw.Test.TestUnitTest.TestCaseTest.subclass(cw.Test.TestUnitTest, 'TestCaseTestDS').methods(
	function setUp(self) {
		self.__class__.upcall(self, 'setUp', []);
		self.mockModule = cw.Test.DSMock;
	}
);



cw.Test.TestUnitTest.TestCaseTest.subclass(cw.Test.TestUnitTest, 'TestCaseTestLooseCalls').methods(
	function setUp(self) {
		self.result = cw.UnitTest.TestResult();
		// Only need to test this with L{Mock}, not DMock or DSMock.
		self.mockModule = cw.Test.Mock;
	},

	/**
	 * Tests with leftover setTimeout calls should cause test to error.
	 */
	function test_setTimeoutLoose(self) {
		var suite = cw.UnitTest.TestSuite();
		var error = self.mockModule._setTimeoutLoose('test_method');
		suite.addTests([error]);

		var d = suite.run(self.result);
		d.addCallback(function(){
			self.assertArraysEqual(self.result.getSummary(), [1, 0, 1, 0]);
			self.assertIdentical(self.result.errors[0].length, 2); // sanity check
			self.assertIdentical(self.result.errors[0][0], error);
			self.assertErrorMessage(
				self.result.errors[0][1],
				"Test ended with 1 pending call(s): setTimeout_pending");
		});
		return d;
	},


	/**
	 * Tests with leftover setTimeout calls should cause test to error.
	 */
	function test_setIntervalLoose(self) {
		var suite = cw.UnitTest.TestSuite();
		var error = self.mockModule._setIntervalLoose('test_method');
		suite.addTests([error]);

		var d = suite.run(self.result);
		d.addCallback(function(){
			self.assertArraysEqual(self.result.getSummary(), [1, 0, 1, 0]);
			self.assertIdentical(self.result.errors[0].length, 2); // just a sanity check
			self.assertIdentical(self.result.errors[0][0], error);
			self.assertErrorMessage(
				self.result.errors[0][1],
				"Test ended with 1 pending call(s): setInterval_pending");
		});
		d.addBoth(function(){
			// Cleanup
			clearInterval(error._interval);
		});
		return d;
	},

	/**
	 * Confirm a deficiency in the current design: loose setTimeout calls
	 * in a "parent" test will cause "child" tests to error, even when that
	 * "child" test isn't responsible for the loose setTimeout.
	 *
	 * The deficiency is caused by UnitTest not having nested delayed-calls tracking
	 * (delayed calls are checked and removed after the teardown of *any* test).
	 *
	 * If the deficiency is fixed, a new test should be written.
	 */
	function test_setTimeoutLooseNested(self) {
		// the loose call in this "parent" test
		var looseTimeout = setTimeout(function(){}, 60);

		var suite = cw.UnitTest.TestSuite();
		// "child" test will have a loose call, too.
		var error = self.mockModule._setTimeoutLoose('test_method');
		suite.addTests([error]);

		var d = suite.run(self.result);
		d.addCallback(function(){
			self.assertArraysEqual(self.result.getSummary(), [1, 0, 1, 0]);
			self.assertIdentical(self.result.errors[0].length, 2); // sanity check
			self.assertIdentical(self.result.errors[0][0], error);
			self.assertErrorMessage(
				self.result.errors[0][1],
				"Test ended with 2 pending call(s): setTimeout_pending,setTimeout_pending");

			// the inner test stopped tracking all the pending calls.
			for (var k in cw.UnitTest.delayedCalls) {
				self.assertArraysEqual([], goog.object.getKeys(cw.UnitTest.delayedCalls[k]));
			}

			clearTimeout(looseTimeout); // This should be in an addCleanup above instead
		});
		return d;
	}
);



cw.UnitTest.TestCase.subclass(cw.Test.TestUnitTest ,'LoaderTests').methods(

	function setUp(self) {
		self.mockModule = cw.Test.Mock;
	},


	/**
	 * Return a list containing the id() of each test in a suite.
	 */
	function getTestIDs(self, suite) {
		var ids = [];
		var visitor = function (test) { ids.push(test.id()); };

		var v = cw.UnitTest.SynchronousVisitor();
		v.traverse(visitor, suite.tests);
		
		return ids;
	},


	/**
	 * Test that C{loadFromClass} returns an empty suite when given a
	 * C{TestCase} subclass that contains no tests.
	 */
	function test_loadFromClassEmpty(self) {
		var suite = cw.UnitTest.loadFromClass(cw.UnitTest.TestCase);
		self.assertArraysEqual([], self.getTestIDs(suite));
	},


	/**
	 * Test that C{loadFromClass} returns a suite which contains all the
	 * test methods in a given C{TestCase} subclass.
	 */
	function test_loadFromClass(self) {
		var suite = cw.UnitTest.loadFromClass(self.mockModule._WasRun);
		self.assertArraysEqual(
			[
				self.mockModule.__name__ + '._WasRun.test_bad',
				self.mockModule.__name__ + '._WasRun.test_error',
				self.mockModule.__name__ + '._WasRun.test_good',
				self.mockModule.__name__ + '._WasRun.test_skip'
			],
			self.getTestIDs(suite));
	},


	/**
	 * Test that C{loadFromModule} returns an empty suite when given a module
	 * with no unit tests.
	 */
	function test_loadFromModuleEmpty(self) {
		var module = {};
		var suite = cw.UnitTest.loadFromModule(module);

		self.assertIdentical(suite.countTestCases(), 0);
	},


	/**
	 * Test that C{loadFromModule} returns a suite which contains all the
	 * test methods in a given module.
	 */
	function test_loadFromModule(self) {
		var MockThis = {'__name__': 'MockThis'};
		MockThis.SomeTestCase = cw.UnitTest.TestCase.subclass('MockThis.SomeTestCase');
		MockThis.SomeTestCase.methods(function test_method(self) {});
		var suite = cw.UnitTest.loadFromModule(MockThis);
		self.assertArraysEqual(self.getTestIDs(suite), ['MockThis.SomeTestCase.test_method']);
	},

	/**
	 * Test that C{loadFromModules} returns an empty suite when given multiple
	 * empty modules.
	 */
	function test_loadFromModulesEmpty(self) {
		var module1 = {}, module2 = {};
		var suite = cw.UnitTest.loadFromModules([module1, module2]);

		self.assertIdentical(suite.countTestCases(), 0);
	}

	// TODO: more loadFromModules tests.
);



cw.Test.TestUnitTest.LoaderTests.subclass(cw.Test.TestUnitTest, 'LoaderTestsD').methods(
	function setUp(self) {
		self.__class__.upcall(self, 'setUp', []);
		self.mockModule = cw.Test.DMock;
	}
);



cw.Test.TestUnitTest.LoaderTests.subclass(cw.Test.TestUnitTest, 'LoaderTestsDS').methods(
	function setUp(self) {
		self.__class__.upcall(self, 'setUp', []);
		self.mockModule = cw.Test.DSMock;
	}
);



cw.UnitTest.TestCase.subclass(cw.Test.TestUnitTest, 'RunnerTest').methods(
	function setUp(self) {
		self.result = cw.UnitTest.TestResult();
		self.mockModule = cw.Test.Mock;
	},


	/**
	 * Test that the summary of an empty result object indicates the 'test run'
	 * passed, and that no tests were run.
	 */
	function test_formatSummaryEmpty(self) {
		self.assertIdentical(
			cw.UnitTest.formatSummary(self.result),
			"PASSED (tests=0)"
		);
	},


	/**
	 * Test that the summary of a result object from a successful test run
	 * indicates that the run was successful along with the number of tests in
	 * the run.
	 */
	function test_formatSummaryOK(self) {
		var test = self.mockModule._WasRun('test_good');

		var d = test.run(self.result);
		d.addCallback(function(){
			self.assertIdentical(
				cw.UnitTest.formatSummary(self.result),
				"PASSED (tests=1)"
			);
		});
		return d;
	},


	/**
	 * Test that the summary of a result object from a test run with failures
	 * indicates an overall failure as well as the number of test failures.
	 */
	function test_formatSummaryFailed(self) {
		var test = self.mockModule._WasRun('test_bad');
		var d = test.run(self.result);
		d.addCallback(function(){
			self.assertIdentical(
				cw.UnitTest.formatSummary(self.result),
				"FAILED (tests=1, failures=1)"
			);
		});
		return d;
	},


	/**
	 * Test that the summary of a result object from a test run with skips
	 * indicates an overall failure as well as the number of test skips.
	 */
	function test_formatSummarySkipped(self) {
		var test = self.mockModule._WasRun('test_skip');
		var d = test.run(self.result);
		d.addCallback(function(){
			self.assertIdentical(
				cw.UnitTest.formatSummary(self.result),
				"PASSED (tests=1, skips=1)"
			);
		});
		return d;
	},


	/**
	 * As L{test_formatSummaryFailed}, but for errors instead of failures.
	 */
	function test_formatSummaryError(self) {
		var test = self.mockModule._WasRun('test_error');
		var d = test.run(self.result);
		d.addCallback(function(){
			self.assertIdentical(
				cw.UnitTest.formatSummary(self.result),
				"FAILED (tests=1, errors=1)"
			);
		});
		return d;
	},


	/**
	 * Sanity test added to make sure the summary makes sense when a suite
	 * has both failed and errored tests.
	 */
	function test_formatSummaryMultiple(self) {
		var test = cw.UnitTest.loadFromClass(self.mockModule._WasRun);

		var d = test.run(self.result);
		d.addCallback(function(){
			self.assertIdentical(
				cw.UnitTest.formatSummary(self.result),
				"FAILED (tests=4, errors=1, failures=1, skips=1)"
			);
		});
		return d;
	}
);



cw.Test.TestUnitTest.RunnerTest.subclass(cw.Test.TestUnitTest, 'RunnerTestD').methods(
	function setUp(self) {
		self.__class__.upcall(self, 'setUp', []);
		self.mockModule = cw.Test.DMock;
	}
);



cw.Test.TestUnitTest.RunnerTest.subclass(cw.Test.TestUnitTest, 'RunnerTestDS').methods(
	function setUp(self) {
		self.__class__.upcall(self, 'setUp', []);
		self.mockModule = cw.Test.DSMock;
	}
);


/**
 * Tests for L{cw.UnitTest.repr}.
 */
cw.UnitTest.TestCase.subclass(cw.Test.TestUnitTest, 'ReprTests').methods(
	/**
	 * Test that repr(undefined) and repr(null) work.
	 */
	function test_undefinedAndNull(self) {
		var repr = cw.UnitTest.repr;
		self.assertIdentical(repr(null), 'null');
		self.assertIdentical(repr(undefined), 'undefined');
	},

	/**
	 * Test that some simple values have a reasonable repr().
	 */
	function test_simpleValues(self) {
		var repr = cw.UnitTest.repr;
		self.assertIdentical(repr(5), '5');
		self.assertIdentical(repr([5]), '[5]');
		self.assertIdentical(repr([5, 6]), '[5,6]');
		self.assertIdentical(repr([5, null]), '[5,null]');
		self.assertIdentical(repr([5, true]), '[5,true]');
		self.assertIdentical(repr([5, false]), '[5,false]');

		self.assertIdentical(repr(new Object()), '({})');
		self.assertIdentical(repr({}), '({})');
		self.assertIdentical(repr({"a": 3, "b": 4}), '({"a":3,"b":4})');
		self.assertIdentical(repr({"a": 3, "b": {}}), '({"a":3,"b":{}})');
		self.assertIdentical(repr({"a": 3, "b": {a: "c"}}), '({"a":3,"b":{"a":"c"}})');
		self.assertIdentical(repr({"a": 3, "b": []}), '({"a":3,"b":[]})');
		self.assertIdentical(repr('foo'), '"foo"');
	},


	function test_shortEscapes(self) {
		var repr = cw.UnitTest.repr;
		self.assertIdentical(repr('fo\to'), '"fo\\to"');
		self.assertIdentical(repr('fo\no'), '"fo\\no"');
		self.assertIdentical(repr('fo\fo'), '"fo\\fo"');
		self.assertIdentical(repr('fo\ro'), '"fo\\ro"');

		self.assertIdentical(repr('fo"o'), '"fo\\"o"');
		self.assertIdentical(repr('fo\'o'), '"fo\'o"'); // no escape of single quote
		self.assertIdentical(repr('fo\\o'), '"fo\\\\o"');

	},

	function test_xAndUEscapes(self) {
		var repr = cw.UnitTest.repr;
		self.assertIdentical(repr('\u0000'), '"\\x00"');
		self.assertIdentical(repr('\u000B'), '"\\x0B"'); // vertical tab; aka \v in decent browsers
		self.assertIdentical(repr('\u0010'), '"\\x10"');
		self.assertIdentical(repr('\u0015'), '"\\x15"');
		self.assertIdentical(repr('\u0019'), '"\\x19"');
		self.assertIdentical(repr('\u0020'), '" "');
		self.assertIdentical(repr('\u007E'), '"~"');
		self.assertIdentical(repr('\u007F'), '"\\x7F"');
		self.assertIdentical(repr('\u0099'), '"\\x99"');
		self.assertIdentical(repr('\u0100'), '"\\u0100"');
		self.assertIdentical(repr('\u0400'), '"\\u0400"');
		self.assertIdentical(repr('\u0999'), '"\\u0999"');
		self.assertIdentical(repr('\u1000'), '"\\u1000"');
		self.assertIdentical(repr('\ubeef'), '"\\uBEEF"');
		self.assertIdentical(repr('\uFFFF'), '"\\uFFFF"');

	},

	function test_nestedEscaping(self) {
		var repr = cw.UnitTest.repr;
		// All the escaping still works in nested objects/arrays
		self.assertIdentical(repr(['\u0000', '\u0000']), '["\\x00","\\x00"]');
		self.assertIdentical(repr(['\u0000', '\u0000', {'\u0000': '0'}]), '["\\x00","\\x00",{"\\x00":"0"}]');

	},

	function test_miscTypes(self) {
		var repr = cw.UnitTest.repr;
	      self.assertIdentical(repr(new Date(2009, 0, 1)), "(new Date(1230796800000))");
		self.assertIdentical(repr(/\t/), '/\\t/');
	}

	// TODO: test that toString/other builtin properties are found in JScript; need a list of them
);



/**
 * Tests for L{cw.UnitTest.setTimeoutMonkey} and L{cw.UnitTest.setIntervalMonkey}.
 */
cw.UnitTest.TestCase.subclass(cw.Test.TestUnitTest, 'TestMonkeys').methods(
	/**
	 * Test that setTimeout and clearTimeout are special actions that save ticket numbers,
	 * and can be cancelled, and do actually stop when cancelled.
	 */
	function test_setTimeoutIsSpecial(self) {
		var neverRunMeWasRun = false;
		var pleaseRunMeWasRun = false;

		var neverRunMe = function() {
			neverRunMeWasRun = true;
		};

		var pleaseRunMe = function() {
			pleaseRunMeWasRun = true;
		};

		// Do NOT change these to window.setTimeout or goog.global.setTimeout, because we need
		// to know that cw.UnitTest.installMonkeys works for the "bare" function call.

		self._ticket1 = setTimeout(neverRunMe, 10);
		self.assertIdentical(1, goog.object.getKeys(cw.UnitTest.delayedCalls['setTimeout_pending']).length);
		self.assertNotIdentical(undefined, cw.UnitTest.delayedCalls['setTimeout_pending'][self._ticket1]);

		self._ticket2 = setTimeout(pleaseRunMe, 11);
		self.assertIdentical(2, goog.object.getKeys(cw.UnitTest.delayedCalls['setTimeout_pending']).length);
		self.assertNotIdentical(undefined, cw.UnitTest.delayedCalls['setTimeout_pending'][self._ticket2]);

		clearTimeout(self._ticket1);
		// ticket2 is *not* cleared. we want to test that setTimeout does work.
		self.assertIdentical(1, goog.object.getKeys(cw.UnitTest.delayedCalls['setTimeout_pending']).length);
		self.assertIdentical(undefined, cw.UnitTest.delayedCalls['setTimeout_pending'][self._ticket1]);
		self.assertNotIdentical(undefined, cw.UnitTest.delayedCalls['setTimeout_pending'][self._ticket2]);

		var d = new goog.async.Deferred();

		d.addCallback(function() {
			self.assertIdentical(false, neverRunMeWasRun);
			self.assertIdentical(true, pleaseRunMeWasRun);
			self.assertIdentical(0, goog.object.getKeys(cw.UnitTest.delayedCalls['setTimeout_pending']).length);
		});

		setTimeout(function(){d.callback(null)}, 30);

		return d;
	},

	/**
	 * Test that setInterval and clearInterval are special actions that save ticket numbers,
	 * and can be cancelled, and do actually stop when cancelled.
	 */
	function test_setIntervalIsSpecial(self) {
		var neverRunMeWasRun = 0;
		var pleaseRunMeWasRun = 0;

		var neverRunMe = function() {
			neverRunMeWasRun += 1;
		};

		var pleaseRunMe = function() {
			pleaseRunMeWasRun += 1;
		};

		// Do NOT change these to window.setInterval or goog.global.setInterval, because we need
		// to know that cw.UnitTest.installMonkeys works for the "bare" function call.

		self._ticket1 = setInterval(neverRunMe, 10);
		self.assertIdentical(1, goog.object.getKeys(cw.UnitTest.delayedCalls['setInterval_pending']).length);
		self.assertNotIdentical(undefined, cw.UnitTest.delayedCalls['setInterval_pending'][self._ticket1]);

		self._ticket2 = setInterval(pleaseRunMe, 10);
		self.assertIdentical(2, goog.object.getKeys(cw.UnitTest.delayedCalls['setInterval_pending']).length);
		self.assertNotIdentical(undefined, cw.UnitTest.delayedCalls['setInterval_pending'][self._ticket2]);

		clearInterval(self._ticket1);
		// ticket2 is *not* cleared yet. we want to test that setInterval does work.
		self.assertIdentical(1, goog.object.getKeys(cw.UnitTest.delayedCalls['setInterval_pending']).length);
		self.assertIdentical(undefined, cw.UnitTest.delayedCalls['setInterval_pending'][self._ticket1]);
		self.assertNotIdentical(undefined, cw.UnitTest.delayedCalls['setInterval_pending'][self._ticket2]);

		var d = new goog.async.Deferred();

		d.addCallback(function() {
			self.assertIdentical(0, neverRunMeWasRun);
			// it may run 2 or 3 times usually, but less or more sometimes, especially with IE6.
			self.assertIdentical(true, 1 <= pleaseRunMeWasRun && pleaseRunMeWasRun <= 5);
			self.assertIdentical(1, goog.object.getKeys(cw.UnitTest.delayedCalls['setInterval_pending']).length);
			clearInterval(self._ticket2);
			self.assertIdentical(0, goog.object.getKeys(cw.UnitTest.delayedCalls['setInterval_pending']).length);
		});

		setTimeout(function(){d.callback(null)}, 35);

		return d;
	},


	function tearDown(self) {
		clearInterval(self._ticket1);
		clearInterval(self._ticket2);
	}
);

})(); // end anti-clobbering for JScript

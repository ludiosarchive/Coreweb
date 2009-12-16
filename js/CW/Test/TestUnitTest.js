/**
 * Tests for CW.UnitTest, the Javascript unit-testing framework.
 * Uses mock test cases provided by CW.Test.*Mock
 */

// import CW.UnitTest
// import CW.Test.Mock
// import CW.Test.DMock
// import CW.Test.DSMock

goog.require('goog.async.Deferred');
goog.require('goog.async.DeferredList');


/**
 * A mock L{TestResult} object that we use to test that L{startTest} and L{stopTest}
 * are called appropriately.
 */
CW.Class.subclass(CW.Test.TestUnitTest, 'MockResult').methods(
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
CW.UnitTest.TestCase.subclass(CW.Test.TestUnitTest, 'TestCaseTest').methods(
	function setUp(self) {
		self.result = CW.UnitTest.TestResult();
		self.mockModule = CW.Test.Mock;
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
		var suite = CW.UnitTest.TestSuite();
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
				self.result.failures[0][1] instanceof CW.AssertionError,
				"self.result.failures[0][1] should have been a CW.AssertionError, not a: " + self.result.failures[0][1]);
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
				self.result.skips[0][1] instanceof CW.UnitTest.SkipTest,
				"self.result.skips[0][1] should have been a CW.UnitTest.SkipTest, not a: " + self.result.skips[0][1]);

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
	 * L{setUp} throws L{CW.UnitTest.SkipTest}.
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
		var result = CW.Test.TestUnitTest.MockResult();
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
		var suite = CW.UnitTest.TestSuite();
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
		var suite = CW.UnitTest.TestSuite();
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
		var d = CW.UnitTest.TestSuite().visit(visitor);

		d.addCallback(function(){
			self.assertArraysEqual(log, []);
			var tests = [self.mockModule._WasRun('test_good1'), self.mockModule._WasRun('test_good2')];
			var suite = CW.UnitTest.TestSuite(tests);

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
		self.assert(self.__class__.subclassOf(CW.UnitTest.TestCase));
		self.assert(!CW.UnitTest.TestCase.subclassOf(self.__class__));
	}
);



CW.Test.TestUnitTest.TestCaseTest.subclass(CW.Test.TestUnitTest, 'TestCaseTestD').methods(
	function setUp(self) {
		self.__class__.upcall(self, 'setUp', []);
		self.mockModule = CW.Test.DMock;
	}
);



CW.Test.TestUnitTest.TestCaseTest.subclass(CW.Test.TestUnitTest, 'TestCaseTestDS').methods(
	function setUp(self) {
		self.__class__.upcall(self, 'setUp', []);
		self.mockModule = CW.Test.DSMock;
	}
);



CW.Test.TestUnitTest.TestCaseTest.subclass(CW.Test.TestUnitTest, 'TestCaseTestLooseCalls').methods(
	function setUp(self) {
		self.result = CW.UnitTest.TestResult();
		// Only need to test this with L{Mock}, not DMock or DSMock.
		self.mockModule = CW.Test.Mock;
	},

	/**
	 * Tests with leftover setTimeout calls should cause test to error.
	 */
	function test_setTimeoutLoose(self) {
		var suite = CW.UnitTest.TestSuite();
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
		var suite = CW.UnitTest.TestSuite();
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
		setTimeout(function(){}, 60);

		var suite = CW.UnitTest.TestSuite();
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
			for (var k in CW.UnitTest.delayedCalls) {
				self.assertArraysEqual([], goog.object.getKeys(CW.UnitTest.delayedCalls[k]));
			}
		});
		return d;
	}
);



CW.UnitTest.TestCase.subclass(CW.Test.TestUnitTest ,'LoaderTests').methods(

	function setUp(self) {
		self.mockModule = CW.Test.Mock;
	},


	/**
	 * Return a list containing the id() of each test in a suite.
	 */
	function getTestIDs(self, suite) {
		var ids = [];
		var visitor = function (test) { ids.push(test.id()); };

		var v = CW.UnitTest.SynchronousVisitor();
		v.traverse(visitor, suite.tests);
		
		return ids;
	},


	/**
	 * Test that C{loadFromClass} returns an empty suite when given a
	 * C{TestCase} subclass that contains no tests.
	 */
	function test_loadFromClassEmpty(self) {
		var suite = CW.UnitTest.loadFromClass(CW.UnitTest.TestCase);
		self.assertArraysEqual([], self.getTestIDs(suite));
	},


	/**
	 * Test that C{loadFromClass} returns a suite which contains all the
	 * test methods in a given C{TestCase} subclass.
	 */
	function test_loadFromClass(self) {
		var suite = CW.UnitTest.loadFromClass(self.mockModule._WasRun);
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
		var suite = CW.UnitTest.loadFromModule(module);

		self.assertIdentical(suite.countTestCases(), 0);
	},


	/**
	 * Test that C{loadFromModule} returns a suite which contains all the
	 * test methods in a given module.
	 */
	function test_loadFromModule(self) {
		var MockThis = {'__name__': 'MockThis'};
		MockThis.SomeTestCase = CW.UnitTest.TestCase.subclass('MockThis.SomeTestCase');
		MockThis.SomeTestCase.methods(function test_method(self) {});
		var suite = CW.UnitTest.loadFromModule(MockThis);
		self.assertArraysEqual(self.getTestIDs(suite), ['MockThis.SomeTestCase.test_method']);
	},

	/**
	 * Test that C{loadFromModules} returns an empty suite when given multiple
	 * empty modules.
	 */
	function test_loadFromModulesEmpty(self) {
		var module1 = {}, module2 = {};
		var suite = CW.UnitTest.loadFromModules([module1, module2]);

		self.assertIdentical(suite.countTestCases(), 0);
	}

	// TODO: more loadFromModules tests.
);



CW.Test.TestUnitTest.LoaderTests.subclass(CW.Test.TestUnitTest, 'LoaderTestsD').methods(
	function setUp(self) {
		self.__class__.upcall(self, 'setUp', []);
		self.mockModule = CW.Test.DMock;
	}
);



CW.Test.TestUnitTest.LoaderTests.subclass(CW.Test.TestUnitTest, 'LoaderTestsDS').methods(
	function setUp(self) {
		self.__class__.upcall(self, 'setUp', []);
		self.mockModule = CW.Test.DSMock;
	}
);



CW.UnitTest.TestCase.subclass(CW.Test.TestUnitTest, 'RunnerTest').methods(
	function setUp(self) {
		self.result = CW.UnitTest.TestResult();
		self.mockModule = CW.Test.Mock;
	},


	/**
	 * Test that the summary of an empty result object indicates the 'test run'
	 * passed, and that no tests were run.
	 */
	function test_formatSummaryEmpty(self) {
		self.assertIdentical(
			CW.UnitTest.formatSummary(self.result),
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
				CW.UnitTest.formatSummary(self.result),
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
				CW.UnitTest.formatSummary(self.result),
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
				CW.UnitTest.formatSummary(self.result),
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
				CW.UnitTest.formatSummary(self.result),
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
		var test = CW.UnitTest.loadFromClass(self.mockModule._WasRun);

		var d = test.run(self.result);
		d.addCallback(function(){
			self.assertIdentical(
				CW.UnitTest.formatSummary(self.result),
				"FAILED (tests=4, errors=1, failures=1, skips=1)"
			);
		});
		return d;
	}
);



CW.Test.TestUnitTest.RunnerTest.subclass(CW.Test.TestUnitTest, 'RunnerTestD').methods(
	function setUp(self) {
		self.__class__.upcall(self, 'setUp', []);
		self.mockModule = CW.Test.DMock;
	}
);



CW.Test.TestUnitTest.RunnerTest.subclass(CW.Test.TestUnitTest, 'RunnerTestDS').methods(
	function setUp(self) {
		self.__class__.upcall(self, 'setUp', []);
		self.mockModule = CW.Test.DSMock;
	}
);


/**
 * Tests for L{CW.UnitTest.repr}.
 */
CW.UnitTest.TestCase.subclass(CW.Test.TestUnitTest, 'ReprTests').methods(
	/**
	 * Test that repr(undefined) and repr(null) work.
	 */
	function test_undefinedAndNull(self) {
		var repr = CW.UnitTest.repr;
		self.assertIdentical(repr(null), 'null');
		self.assertIdentical(repr(undefined), 'undefined');
	},

	/**
	 * Test that some simple values have a reasonable repr().
	 */
	function test_simpleValues(self) {
		var repr = CW.UnitTest.repr;
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
		var repr = CW.UnitTest.repr;
		self.assertIdentical(repr('fo\to'), '"fo\\to"');
		self.assertIdentical(repr('fo\no'), '"fo\\no"');
		self.assertIdentical(repr('fo\fo'), '"fo\\fo"');
		self.assertIdentical(repr('fo\ro'), '"fo\\ro"');

		self.assertIdentical(repr('fo"o'), '"fo\\"o"');
		self.assertIdentical(repr('fo\'o'), '"fo\'o"'); // no escape of single quote
		self.assertIdentical(repr('fo\\o'), '"fo\\\\o"');

	},

	function test_xAndUEscapes(self) {
		var repr = CW.UnitTest.repr;
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
		var repr = CW.UnitTest.repr;
		// All the escaping still works in nested objects/arrays
		self.assertIdentical(repr(['\u0000', '\u0000']), '["\\x00","\\x00"]');
		self.assertIdentical(repr(['\u0000', '\u0000', {'\u0000': '0'}]), '["\\x00","\\x00",{"\\x00":"0"}]');

	},

	function test_miscTypes(self) {
		var repr = CW.UnitTest.repr;
	      self.assertIdentical(repr(new Date(2009, 0, 1)), "(new Date(1230796800000))");
		self.assertIdentical(repr(/\t/), '/\\t/');
	}

	// TODO: test that toString/other builtin properties are found in JScript; need a list of them
);



/**
 * Tests for L{CW.UnitTest.setTimeoutMonkey} and L{CW.UnitTest.setIntervalMonkey}.
 */
CW.UnitTest.TestCase.subclass(CW.Test.TestUnitTest, 'TestMonkeys').methods(
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

		self._ticket1 = setTimeout(neverRunMe, 10);
		self.assertIdentical(1, goog.object.getKeys(CW.UnitTest.delayedCalls['setTimeout_pending']).length);
		self.assertNotIdentical(undefined, CW.UnitTest.delayedCalls['setTimeout_pending'][self._ticket1]);

		self._ticket2 = setTimeout(pleaseRunMe, 11);
		self.assertIdentical(2, goog.object.getKeys(CW.UnitTest.delayedCalls['setTimeout_pending']).length);
		self.assertNotIdentical(undefined, CW.UnitTest.delayedCalls['setTimeout_pending'][self._ticket2]);

		clearTimeout(self._ticket1);
		// ticket2 is *not* cleared. we want to test that setTimeout does work.
		self.assertIdentical(1, goog.object.getKeys(CW.UnitTest.delayedCalls['setTimeout_pending']).length);
		self.assertIdentical(undefined, CW.UnitTest.delayedCalls['setTimeout_pending'][self._ticket1]);
		self.assertNotIdentical(undefined, CW.UnitTest.delayedCalls['setTimeout_pending'][self._ticket2]);

		var d = new goog.async.Deferred();

		d.addCallback(function() {
			self.assertIdentical(false, neverRunMeWasRun);
			self.assertIdentical(true, pleaseRunMeWasRun);
			self.assertIdentical(0, goog.object.getKeys(CW.UnitTest.delayedCalls['setTimeout_pending']).length);
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

		self._ticket1 = setInterval(neverRunMe, 10);
		self.assertIdentical(1, goog.object.getKeys(CW.UnitTest.delayedCalls['setInterval_pending']).length);
		self.assertNotIdentical(undefined, CW.UnitTest.delayedCalls['setInterval_pending'][self._ticket1]);

		self._ticket2 = setInterval(pleaseRunMe, 10);
		self.assertIdentical(2, goog.object.getKeys(CW.UnitTest.delayedCalls['setInterval_pending']).length);
		self.assertNotIdentical(undefined, CW.UnitTest.delayedCalls['setInterval_pending'][self._ticket2]);

		clearInterval(self._ticket1);
		// ticket2 is *not* cleared yet. we want to test that setInterval does work.
		self.assertIdentical(1, goog.object.getKeys(CW.UnitTest.delayedCalls['setInterval_pending']).length);
		self.assertIdentical(undefined, CW.UnitTest.delayedCalls['setInterval_pending'][self._ticket1]);
		self.assertNotIdentical(undefined, CW.UnitTest.delayedCalls['setInterval_pending'][self._ticket2]);

		var d = new goog.async.Deferred();

		d.addCallback(function() {
			self.assertIdentical(0, neverRunMeWasRun);
			// it may run 2 or 3 times usually, but less or more sometimes, especially with IE6.
			self.assertIdentical(true, 1 <= pleaseRunMeWasRun && pleaseRunMeWasRun <= 5);
			self.assertIdentical(1, goog.object.getKeys(CW.UnitTest.delayedCalls['setInterval_pending']).length);
			clearInterval(self._ticket2);
			self.assertIdentical(0, goog.object.getKeys(CW.UnitTest.delayedCalls['setInterval_pending']).length);
		});

		setTimeout(function(){d.callback(null)}, 35);

		return d;
	},


	function tearDown(self) {
		clearInterval(self._ticket1);
		clearInterval(self._ticket2);
	}
);


/**
 * Tests for L{CW.UnitTest.uniqArray}
 */
CW.UnitTest.TestCase.subclass(CW.Test.TestUnitTest, 'UniqArrayTests').methods(

	function test_returnsArray(self) {
		var a = [3, 2];
		var b = CW.UnitTest.uniqArray(a);
		self.assert(b.length !== undefined);
	},

	function test_noMutation(self) {
		var a = [3, 3, 2];
		CW.UnitTest.uniqArray(a);
		self.assertEqual([3, 3, 2], a);
	},

	// "at end", "in middle", "at start" refer to the sorted array.

	function test_numbersDupesAtEnd(self) {
		var a = [3, 3, 2, 0, -2];
		var b = CW.UnitTest.uniqArray(a);
		self.assertEqual([-2, 0, 2, 3], b);
	},


	function test_numbersDupesInMiddle(self) {
		var a = [3, 3, 2, 2, 0, -2];
		var b = CW.UnitTest.uniqArray(a);
		self.assertEqual([-2, 0, 2, 3], b);
	},


	function test_numbersDupesAtStart(self) {
		var a = [3, 3, 2, 0, -2, -2, -2];
		var b = CW.UnitTest.uniqArray(a);
		self.assertEqual([-2, 0, 2, 3], b);
	},


	function test_numbersAndStrings(self) {
		var a = [3, 3, 2, 0, -2, '2', '3', 3, '3', '3', 3, 3, 3, '3', 3, '3', 3, 3.0, 3.0];
		var b = CW.UnitTest.uniqArray(a);
		// How strings and numbers are mixed in a sorted array varies accross browsers,
		// so we'll just check the length.
		self.assertEqual(6, b.length);
	},


	function test_strings(self) {
		var a = ['2', '2', '2'];
		var b = CW.UnitTest.uniqArray(a);
		self.assertEqual(['2'], b);
	},


	function test_other(self) {
		var a = [null, undefined, NaN, Infinity, true, false];
		var b = CW.UnitTest.uniqArray(a);
		self.assertEqual(6, b.length);
	},


	function test_otherWithDupes(self) {
		var a = [true, null, undefined, NaN, false, Infinity, undefined, true, false];
		var b = CW.UnitTest.uniqArray(a);
		self.assertEqual(6, b.length);
	}
);



/**
 * Tests for L{CW.UnitTest.Clock}
 */
CW.UnitTest.TestCase.subclass(CW.Test.TestUnitTest, 'ClockTests').methods(

	/**
	 * setTimeout and setInterval return tickets from the same pool
	 * of numbers. None of the ticket numbers are the same.
	 */
	function test_setWhateverUseGlobalCounter(self) {
		var clock = new CW.UnitTest.Clock();
		var tickets = [
			clock.setTimeout(function(){}, 0),
			clock.setTimeout(function(){}, 0),
			clock.setInterval(function(){}, 1),
			clock.setInterval(function(){}, 1)
		];

		self.assertEqual(4, CW.UnitTest.uniqArray(tickets).length);
	},

	/**
	 * clearTimeout
	 */
	function test_clearTimeout(self) {
		var clock = new CW.UnitTest.Clock();
		var ticket1 = clock.setTimeout(function(){}, 0);
		var ticket2 = clock.setTimeout(function(){}, 0);
		var ticket3 = clock.setTimeout(function(){}, 0);
		self.assertEqual(3, clock._countPendingEvents());

		// "clear" some bogus ticket ID, make sure nothing changed.
		clock.clearTimeout(-1237897661782631241233143);
		self.assertEqual(3, clock._countPendingEvents());

		// clear the real ticket
		clock.clearTimeout(ticket2);
		self.assertEqual(2, clock._countPendingEvents());

		// make sure the other tickets are still there
		self.assert(clock._isTicketInEvents(ticket1));
		self.assert(clock._isTicketInEvents(ticket3));

		// Check for clearInterval can clear a timeout.
		clock.clearInterval(ticket1);
		clock.clearInterval(ticket3);
		self.assertEqual(0, clock._countPendingEvents());
	},


	function test_clearBogusIntervals(self) {
		var clock = new CW.UnitTest.Clock();
		self.assertEqual(undefined, clock.clearTimeout(-1237897661782631241233143));
		self.assertEqual(undefined, clock.clearInterval(1237897661782631241233143));
	},


	function test_clearTimeoutCanClearInterval(self) {
		var clock = new CW.UnitTest.Clock();
		var ticket1 = clock.setInterval(function(){}, 1);
		self.assertEqual(1, clock._countPendingEvents());
		clock.clearTimeout(ticket1);
		self.assertEqual(0, clock._countPendingEvents());
	},


	function test_advanceTwoTimeoutsSeperately(self) {
		var clock = new CW.UnitTest.Clock();
		var called1 = false;
		var called2 = false;
		clock.setTimeout(function(){called1 = true}, 3);
		clock.setTimeout(function(){called2 = true}, 4);

		clock.advance(1);
		clock.advance(1);
		self.assertEqual(false, called1);
		clock.advance(1);
		self.assertEqual(true, called1);
		self.assertEqual(false, called2);

		clock.advance(1);
		self.assertEqual(true, called2);
	},


	function test_advanceTwoTimeoutsAtSameTime(self) {
		var clock = new CW.UnitTest.Clock();
		var called1 = false;
		var called2 = false;
		clock.setTimeout(function(){called1 = true}, 2);
		clock.setTimeout(function(){called2 = true}, 2);
		self.assertEqual(false, called1);
		self.assertEqual(false, called2);

		// the far future
		clock.advance(10000);
		self.assertEqual(true, called1);
		self.assertEqual(true, called2);
	},


	function test_advanceSlowlyInterval(self) {
		var clock = new CW.UnitTest.Clock();
		var called1 = 0;
		var called2 = 0;
		clock.setInterval(function(){called1 += 1}, 2);
		clock.setInterval(function(){called2 += 1}, 3);

		clock.advance(2);
		self.assertEqual(1, called1);
		self.assertEqual(0, called2);

		clock.advance(1);
		self.assertEqual(1, called1);
		self.assertEqual(1, called2);

		clock.advance(3);
		self.assertEqual(3, called1);
		self.assertEqual(2, called2);
	},


	function test_advanceQuicklyInterval(self) {
		var clock = new CW.UnitTest.Clock();
		var called1 = 0;
		var called2 = 0;
		clock.setInterval(function(){called1 += 1}, 2);
		clock.setInterval(function(){called2 += 1}, 3);

		clock.advance(6);
		self.assertEqual(3, called1);
		self.assertEqual(2, called2);
	},


	function test_reentrantAddCalls(self) {
		var clock = new CW.UnitTest.Clock();
		var called1 = 0;
		var immediateCall = false;
		var called2 = 0;
		clock.setInterval(function(){
			if(called1 === 0) {
				clock.setTimeout(function(){immediateCall = true}, 0);
				clock.setInterval(function(){called2 += 1}, 1);
			}
			called1 += 1
		}, 2);

		clock.advance(2);
		self.assertEqual(1, called1);
		self.assertEqual(true, immediateCall);
		self.assertEqual(0, called2);

		clock.advance(4);
		self.assertEqual(3, called1);
		self.assertEqual(4, called2);
	},


	/**
	 * Test that intervals can be cleared from inside a callable.
	 */
	function test_clearIntervalInsideCallable(self) {
		var clock = new CW.UnitTest.Clock();
		var called1 = 0;
		var called2 = 0;
		var ticket1 = clock.setInterval(function(){called1 += 1}, 2);
		clock.setInterval(function(){called2 += 1; clock.clearTimeout(ticket1)}, 3);

		clock.advance(2);
		self.assertEqual(1, called1);
		self.assertEqual(0, called2);

		clock.advance(1);
		self.assertEqual(1, called1);
		self.assertEqual(1, called2);
		// ticket1 should be cleared at this point.

		clock.advance(6);
		self.assertEqual(1, called1);
		self.assertEqual(3, called2);
	},


	/**
	 * Similar to test_clearIntervalInsideCallable, except we only advance the clock
	 * once.
	 */
	function test_clearIntervalAppliesImmediately(self) {
		var clock = new CW.UnitTest.Clock();
		var called1 = 0;
		var called2 = 0;
		var ticket1 = clock.setInterval(function(){called1 += 1}, 2);
		clock.setInterval(function(){called2 += 1; clock.clearTimeout(ticket1)}, 3);
		
		clock.advance(9);
		self.assertEqual(1, called1);
		self.assertEqual(3, called2);
	},


	function test_reentrantAdvance(self) {
		var clock = new CW.UnitTest.Clock();
		var called1 = 0;
		var called2 = 0;
		var called3 = 0;
		var called4 = 0;
		clock.setTimeout(function(){called1 += 1; clock.advance(1);}, 2);
		clock.setTimeout(function(){called2 += 1}, 3);
		clock.setTimeout(function(){called3 += 1}, 2);
		clock.setTimeout(function(){called4 += 1}, 4);
		clock.advance(2);
		self.assertEqual(1, called1);
		self.assertEqual(1, called2);
		self.assertEqual(1, called3);
		self.assertEqual(0, called4);
	},


	function test_callablesCalledWithWindowThis(self) {
		var called = 0;
		function callable() {
			// Don't use assertIdentical; if that fails here, you'll see a stack overflow. 
			self.assert(this === window, "this !== window");
			called = 1;
		}
		var clock = new CW.UnitTest.Clock();
		clock.setTimeout(callable, 1);
		clock.advance(1);
		self.assert(called === 1, "callable wasn't even called?");
	},


	function test_clockAdvanceError(self) {
		var clock = new CW.UnitTest.Clock();
		self.assertThrows(CW.UnitTest.ClockAdvanceError, function(){clock.advance(-1);});
		self.assertThrows(CW.UnitTest.ClockAdvanceError, function(){clock.advance(-0.5);});
	},


	function test_dateObject(self) {
		var clock = new CW.UnitTest.Clock();
		var date = new clock.Date();
		self.assertEqual(0, date.getTime());
		clock.advance(1001);
		self.assertEqual(1001, date.getTime());
	}

);

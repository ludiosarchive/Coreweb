/**
 * Tests for CW.UnitTest, the Javascript unit-testing framework.
 * Uses mock test cases provided by CW.Test.(Mock|DMock).
 */

// import CW.UnitTest
// import CW.Test.Mock
// import CW.Test.DMock
// import CW.Test.DSMock


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
 * Tests for assertions in L{CW.UnitTest.TestCase}.
 */
CW.UnitTest.TestCase.subclass(CW.Test.TestUnitTest, 'AssertionTests').methods(
	/**
	 * Test that L{assert} raises an exception if its expression is false.
	 */
	function test_assert(self) {
		self.assertThrows(
			CW.UnitTest.AssertionError,
			function() { self.assert(false, "message"); }
		);
	},

	/**
	 * Verify that isTestCaseClass returns a positive result for TestCase
	 * subclasses and a negative result for other types of object.
	 */

	function test_isTestCaseClass(self) {
		self.assertIdentical(
			true, CW.UnitTest.isTestCaseClass(
				CW.Test.TestUnitTest.AssertionTests));
		self.assertIdentical(
			false, CW.UnitTest.isTestCaseClass(
				CW.Test.TestUnitTest.AssertionTests()));
		self.assertIdentical(
			false, CW.UnitTest.isTestCaseClass(1));
	},


	/**
	 * Test assertFailure with immediate error
	 */

	function test_assertFailureImmediate(self) {
		var d = new CW.Defer.Deferred();
		d.errback(Error("Throwing an Error.")); // right now
		self.assertFailure(d, [Error]);
		return d;
	},


	/**
	 * Test assertFailure (previous not tested anywhere, including Athena)
	 */

	function test_assertFailureDelayed(self) {
		var d = new CW.Defer.Deferred();
		setTimeout(function(){d.errback(Error("Throwing an Error."));}, 10);
		self.assertFailure(d, [Error]);
		return d;
	},


	/**
	 * Test that L{assertThrows} doesn't raise an exception if its callable
	 * raises the excepted error.
	 */
	function test_assertThrowsPositive(self) {
		try {
			self.assertThrows(
				CW.UnitTest.AssertionError,
				function() { throw CW.UnitTest.AssertionError(); }
			);
		} catch (e) {
			self.fail("assertThrows should have passed: " + e.getMessage());
		}
	},


	/**
	 * Test that L{assertThrows} raises an exception if its callable does
	 * I{not} raise an exception.
	 */
	function test_assertThrowsNoException(self) {
		var raised = true;
		try {
			self.assertThrows(
				CW.UnitTest.AssertionError,
				function() {}
			);
			raised = false;
		} catch (e) {
			if (!(e instanceof CW.UnitTest.AssertionError)) {
				self.fail("assertThrows should have thrown AssertionError");
			}
		}
		if (!raised) {
			self.fail("assertThrows did not raise an error");
		}
	},


	/**
	 * Test that L{assertThrows} raises an exception if its callable does
	 * I{not} raise an exception, even when optional message assertion is passed in.
	 */
	function test_assertThrowsNoExceptionOptionalMessage(self) {
		var raised = true;
		try {
			self.assertThrows(
				CW.UnitTest.AssertionError,
				function() {}, "this message will never be cared about");
			raised = false;
		} catch (e) {
			if (!(e instanceof CW.UnitTest.AssertionError)) {
				self.fail("assertThrows should have thrown AssertionError");
			}
		}
		if (!raised) {
			self.fail("assertThrows did not raise an error");
		}
	},


	/**
	 * Test that L{assertThrows} raises an exception if its callable raises
	 * the wrong kind of exception.
	 */
	function test_assertThrowsWrongException(self) {
		var IndexError = CW.Error.subclass("IndexError");
		var raised = true;
		try {
			self.assertThrows(
				CW.UnitTest.AssertionError,
				function() { throw IndexError(); }
			);
			raised = false;
		} catch (e) {
			if (!(e instanceof CW.UnitTest.AssertionError)) {
				self.fail("assertThrows should have thrown AssertionError");
			}
		}
		if (!raised) {
			self.fail("assertThrows did not raise an error");
		}
	},


	/**
	 * Test that L{assertThrows} raises an exception if the exception
	 * raised by the callable has the wrong message.
	 */
	function test_assertThrowsWrongMessage(self) {
		var raised = true;
		var IndexError = CW.Error.subclass("IndexError");
		try {
			self.assertThrows(IndexError,
							  function() { throw IndexError("correct message"); }, "wrong message");
			raised = false;
		} catch (e) {
			if (!(e instanceof CW.UnitTest.AssertionError)) {
				self.fail("assertThrows should have thrown AssertionError");
			}
		}
		if (!raised) {
			self.fail("assertThrows did not raise an error");
		}
	},


	/**
	 * Test that L{compare} does not raise an exception if its callable
	 * returns C{true}.
	 */
	function test_comparePositive(self) {
		self.compare(function() { return true; });
	},


	/**
	 * Test that L{compare} raises an error if its callable returns C{false}.
	 */
	function test_compareNegative(self) {
		self.assertThrows(
			CW.UnitTest.AssertionError,
			function() {
				self.compare(
					function (a, b) { return a === b; },
					"not ===", "a", "b"
				);
			}
		);
	},


	/**
	 * Test that the message of L{compare}'s AssertionError describes the
	 * failed the comparison based on its parameters.
	 */
	function test_compareDefaultMessage(self) {
		try {
			self.compare(function() { return false; }, "<->", "a", "b");
		} catch (e) {
			self.assertIdentical(e.getMessage(), '[0] "a" <-> "b"');
		}
	},


	/**
	 * Test that the L{compare}'s AssertionError includes the optional
	 * message if it is provided.
	 */
	function test_compareWithMessage(self) {
		try {
			self.compare(function() { return false; }, "<->", "a", "b", "Hello");
		} catch (e) {
			self.assertIdentical(e.getMessage(), '[0] "a" <-> "b": Hello');
		}
	},


	/**
	 * Test that L{assertIdentical} raises an exception if its arguments are
	 * unequal, and that the message of the raised exception contains the
	 * arguments.
	 */
	function test_assertIdenticalNegative(self) {
		var e = self.assertThrows(
			CW.UnitTest.AssertionError,
			function() {
				self.assertIdentical('apple', 'orange');
			}
		);
		self.assertIdentical(e.getMessage(),
			'[0] "apple" <font color=\"red\">not ===</font> "orange"');
	},


	/**
	 * If L{assertIdentical} is given a message as an optional third argument,
	 * that message should appear in the raised exception's message. Test this.
	 */
	function test_assertIdenticalNegativeWithMessage(self) {
		try {
			self.assertIdentical('apple', 'orange', 'some message');
		} catch (e) {
			self.assertIdentical(
				e.getMessage(),
				'[0] "apple" <font color=\"red\">not ===</font> "orange": some message'
			);
		}
	},


	/**
	 * Test that L{assertIdentical} doesn't raise an exception if its
	 * arguments are equal.
	 */
	function test_assertIdenticalPositive(self) {
		self.assertIdentical('apple', 'apple');
	},


	/**
	 * Test that L{assertIdentical} thinks that 1 and '1' are unequal.
	 */
	function test_assertIdenticalDifferentTypes(self) {
		var raised = true;
		var e = self.assertThrows(
			CW.UnitTest.AssertionError,
			function() {
				self.assertIdentical(1, '1');
			}
		);
		self.assertIdentical(
			e.getMessage(),
			"[0] 1 <font color=\"red\">not ===</font> \"1\"");
	},


	/**
	 * Test that L{assertArraysEqual} doesn't raise an exception if it is
	 * passed that two 'equal' arrays.
	 */
	function test_assertArraysEqualPositive(self) {
		self.assertArraysEqual([], []);
		self.assertArraysEqual([1, 2], [1, 2]);
	},


	/**
	 * Test that L{assertArraysNotEqual} doesn't raise an exception if it is
	 * passed that two 'unequal' arrays.
	 */
	function test_assertArraysNotEqualPositive(self) {
		self.assertArraysNotEqual([1], []);
		self.assertArraysNotEqual([1, 2, 3], [1, 2]);
	},


	/**
	 * Test that L{assertArraysEqual} raises exceptions if it is passed two unequal
	 * arrays.
	 */
	function test_assertArraysEqualNegative(self) {
		self.assertThrows(
			CW.UnitTest.AssertionError,
			function() {
				self.assertArraysEqual([1, 2], [1, 2, 3]);
			}
		);
		self.assertThrows(
			CW.UnitTest.AssertionError,
			function() {
				self.assertArraysEqual({'foo': 2}, [2]);
			}
		);
		self.assertThrows(
			CW.UnitTest.AssertionError,
			function() {
				self.assertArraysEqual(1, [1]);
			}
		);
		self.assertThrows(
			CW.UnitTest.AssertionError,
			function() {
				self.assertArraysEqual(
					function() { return 1; },
					function() { return 2; }
				);
			}
		);
		self.assertThrows(
			CW.UnitTest.AssertionError,
			function() {
				self.assertArraysEqual(
					function() {},
					function() {}
				);
			}
		);
	},


	/**
	 * Test that L{assertArraysNotEqual} raises exceptions if it is passed two equal
	 * arrays.
	 */
	function test_assertArraysNotEqualNegative(self) {
		self.assertThrows(CW.UnitTest.AssertionError,
						  function() {
							  self.assertArraysNotEqual([1, 2, 3], [1, 2, 3]);
						  });
		self.assertThrows(CW.UnitTest.AssertionError,
						  function() {
							  self.assertArraysNotEqual([2], [2]);
						  });
		self.assertThrows(CW.UnitTest.AssertionError,
						  function() {
							  self.assertArraysNotEqual([], []);
						  });
	},


	/**
	 * Test that two equal arrays are not identical, and that an object is
	 * identical to itself.
	 */
	function test_assertIdentical(self) {
		var foo = [1, 2];
		self.assertIdentical(foo, foo);
		self.assertThrows(CW.UnitTest.AssertionError,
						  function() { self.assertIdentical(foo, [1, 2]); });
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
				self.result.failures[0][1] instanceof CW.Defer.Failure,
				"self.result.failures[0][1] should have been a CW.Defer.Failure, not a: " + self.result.failures[0][1]);
			self.assert(
				self.result.failures[0][1].error instanceof CW.UnitTest.AssertionError,
				"self.result.failures[0][1].error should have been a CW.UnitTest.AssertionError, not a: " + self.result.failures[0][1].error);
			self.assertIdentical(self.result.failures[0][1].error.getMessage(), "[0] fail this test deliberately");

			// check the error
			self.assertIdentical(self.result.errors[0].length, 2);
			self.assertIdentical(self.result.errors[0][0], error);
			self.assert(
				self.result.errors[0][1] instanceof CW.Defer.Failure,
				"self.result.errors[0][1] should have been a CW.Defer.Failure, not a: " + self.result.errors[0][1]);
			self.assert(
				self.result.errors[0][1].error instanceof CW.Error,
				"self.result.errors[0][1].error should have been a CW.Error, not a: " + self.result.errors[0][1].error);

			// check the skip
			self.assertIdentical(self.result.skips[0].length, 2);
			self.assertIdentical(self.result.skips[0][0], skip);
			self.assert(
				self.result.skips[0][1] instanceof CW.Defer.Failure,
				"self.result.skips[0][1] should have been a CW.Defer.Failure, not a: " + self.result.skips[0][1]);
			self.assert(
				self.result.skips[0][1].error instanceof CW.UnitTest.SkipTest,
				"self.result.skips[0][1].error should have been a CW.UnitTest.SkipTest, not a: " + self.result.skips[0][1].error);

			self.assertIdentical(self.result.errors[0][1].error.getMessage(), "error");
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
			self.assert(
				self.result.errors[0][1] instanceof CW.Defer.Failure,
				"self.result.errors[0][1] should have been a CW.Defer.Failure, not a: " + self.result.errors[0][1]);
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
			self.assert(
				self.result.skips[0][1] instanceof CW.Defer.Failure,
				"self.result.skips[0][1] should have been a CW.Defer.Failure, not a: " + self.result.skips[0][1]);
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
			self.assert(
				self.result.errors[0][1] instanceof CW.Defer.Failure,
				"self.result.errors[0][1] should have been a CW.Defer.Failure, not a: " + self.result.errors[0][1]);
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
			return CW.Defer.succeed(null);
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
		CW.Test.TestUnitTest.TestCaseTestD.upcall(self, 'setUp', []);
		self.mockModule = CW.Test.DMock;
	}
);



CW.Test.TestUnitTest.TestCaseTest.subclass(CW.Test.TestUnitTest, 'TestCaseTestDS').methods(
	function setUp(self) {
		CW.Test.TestUnitTest.TestCaseTestDS.upcall(self, 'setUp', []);
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
			self.assert(self.result.errors[0][1] instanceof CW.Defer.Failure);
			self.assertIdentical(
				self.result.errors[0][1].error.getMessage(),
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
			//CW.msg('the error: ' + self.result.errors[0][1] + ', ' + self.result.errors[0][1].message);
			self.assert(self.result.errors[0][1] instanceof CW.Defer.Failure); // seen some cases where IE6 disagree with this, and the thing below.
			self.assertIdentical(
				self.result.errors[0][1].error.getMessage(),
				"Test ended with 1 pending call(s): setInterval_pending");
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
		setTimeout(function(){}, 300);

		var suite = CW.UnitTest.TestSuite();
		// "child" test will have a loose call, too.
		var error = self.mockModule._setTimeoutLoose('test_method');
		suite.addTests([error]);

		var d = suite.run(self.result);
		d.addCallback(function(){
			self.assertArraysEqual(self.result.getSummary(), [1, 0, 1, 0]);
			self.assertIdentical(self.result.errors[0].length, 2); // sanity check
			self.assertIdentical(self.result.errors[0][0], error);
			self.assert(self.result.errors[0][1] instanceof CW.Defer.Failure);
			self.assertIdentical(
				self.result.errors[0][1].error.getMessage(),
				"Test ended with 2 pending call(s): setTimeout_pending,setTimeout_pending");

			// the inner test stopped tracking all the pending calls.
			for (var k in CW.UnitTest.delayedCalls) {
				self.assertArraysEqual([], CW.dir(CW.UnitTest.delayedCalls[k]));
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
		CW.Test.TestUnitTest.LoaderTestsD.upcall(self, 'setUp', []);
		self.mockModule = CW.Test.DMock;
	}
);



CW.Test.TestUnitTest.LoaderTests.subclass(CW.Test.TestUnitTest, 'LoaderTestsDS').methods(
	function setUp(self) {
		CW.Test.TestUnitTest.LoaderTestsDS.upcall(self, 'setUp', []);
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
		CW.Test.TestUnitTest.RunnerTestD.upcall(self, 'setUp', []);
		self.mockModule = CW.Test.DMock;
	}
);



CW.Test.TestUnitTest.RunnerTest.subclass(CW.Test.TestUnitTest, 'RunnerTestDS').methods(
	function setUp(self) {
		CW.Test.TestUnitTest.RunnerTestDS.upcall(self, 'setUp', []);
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
		self.assertIdentical(repr('foo'), '"foo"');
		self.assert(repr(['foo']).search('foo') >= 0);
	}
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

		var ticket1 = setTimeout(neverRunMe, 10);
		self.assertIdentical(1, CW.dir(CW.UnitTest.delayedCalls['setTimeout_pending']).length);
		self.assertNotIdentical(undefined, CW.UnitTest.delayedCalls['setTimeout_pending'][ticket1]);

		var ticket2 = setTimeout(pleaseRunMe, 11);
		self.assertIdentical(2, CW.dir(CW.UnitTest.delayedCalls['setTimeout_pending']).length);
		self.assertNotIdentical(undefined, CW.UnitTest.delayedCalls['setTimeout_pending'][ticket2]);

		clearTimeout(ticket1);
		// ticket2 is *not* cleared. we want to test that setTimeout does work.
		self.assertIdentical(1, CW.dir(CW.UnitTest.delayedCalls['setTimeout_pending']).length);
		self.assertIdentical(undefined, CW.UnitTest.delayedCalls['setTimeout_pending'][ticket1]);
		self.assertNotIdentical(undefined, CW.UnitTest.delayedCalls['setTimeout_pending'][ticket2]);

		var d = new CW.Defer.Deferred();

		setTimeout(function() {
			// Do this try/catch/errback to avoid breaking the test runner
			// when the test fails. It breaks without this because setTimeout is in
			// its own execution context, and doesn't reach `d.callback(null)` if the assert fails.
			var errBacked = false;
			try {
				self.assertIdentical(false, neverRunMeWasRun);
				self.assertIdentical(true, pleaseRunMeWasRun);
				self.assertIdentical(0, CW.dir(CW.UnitTest.delayedCalls['setTimeout_pending']).length);
			} catch(e) {
				errBacked = true;
				d.errback(e);
			}
			if(!errBacked) {
				d.callback(null);
			}
		}, 30);

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

		var ticket1 = setInterval(neverRunMe, 10);
		self.assertIdentical(1, CW.dir(CW.UnitTest.delayedCalls['setInterval_pending']).length);
		self.assertNotIdentical(undefined, CW.UnitTest.delayedCalls['setInterval_pending'][ticket1]);

		var ticket2 = setInterval(pleaseRunMe, 10);
		self.assertIdentical(2, CW.dir(CW.UnitTest.delayedCalls['setInterval_pending']).length);
		self.assertNotIdentical(undefined, CW.UnitTest.delayedCalls['setInterval_pending'][ticket2]);

		clearInterval(ticket1);
		// ticket2 is *not* cleared yet. we want to test that setInterval does work.
		self.assertIdentical(1, CW.dir(CW.UnitTest.delayedCalls['setInterval_pending']).length);
		self.assertIdentical(undefined, CW.UnitTest.delayedCalls['setInterval_pending'][ticket1]);
		self.assertNotIdentical(undefined, CW.UnitTest.delayedCalls['setInterval_pending'][ticket2]);

		var d = new CW.Defer.Deferred();

		setTimeout(function() {
			// Do this try/catch/errback to avoid breaking the test runner
			// when the test fails. It breaks without this because setTimeout is in
			// its own execution context, and doesn't reach `d.callback(null)` if the assert fails.
			// (this comment is copy/pasted)
			var errBacked = false;
			try {
				self.assertIdentical(0, neverRunMeWasRun);
				// it may run 2 or 3 times usually, but less or more sometimes, especially with IE6.
				self.assertIdentical(true, 1 <= pleaseRunMeWasRun && pleaseRunMeWasRun <= 5);
				self.assertIdentical(1, CW.dir(CW.UnitTest.delayedCalls['setInterval_pending']).length);
				clearInterval(ticket2);
				self.assertIdentical(0, CW.dir(CW.UnitTest.delayedCalls['setInterval_pending']).length);
			} catch(e) {
				errBacked = true;
				d.errback(e);
			}
			if(!errBacked) {
				d.callback(null);
			}
		}, 35);

		return d;
	}
);


/**
 * These are some mock L{TestCase}s that are used by L{TestUnitTest}
 * in order to test the unit testing framework.
 *
 * This file was copy/pasted from DSMock.js, and modified to return L{goog.async.Deferred}s.
 *
 * "GDS" means "Google Deferred synchronous"
 */

// import CW.UnitTest

goog.require('goog.async.Deferred');

/**
 * L{TestCase} subclass that we use as the primary subject of our tests in
 * L{TestCaseTest}.
 *
 * L{_WasRun} mostly just keeps track of which methods were called on it.
 */
CW.UnitTest.TestCase.subclass(CW.Test.GDSMock, '_WasRun').methods(
	function __init__(self, methodName) {
		self.log = "";
		CW.Test.GDSMock._WasRun.upcall(self, '__init__', [methodName]);
	},

	function setUp(self) {
		var d = new goog.async.Deferred();
		self.log += 'setUp '; d.callback(null);
		return d;
	},

	function test_good(self) {
		var d = new goog.async.Deferred();
		self.log += 'test '; d.callback(null);
		return d;
	},

	function test_bad(self) {
		var d = new goog.async.Deferred();
		d.errback(self.getFailError("fail this test deliberately"));
		return d;
	},

	function test_error(self) {
		var d = new goog.async.Deferred();
		d.errback(CW.Error("error"));
		return d;
	},

	function test_skip(self) {
		var d = new goog.async.Deferred();
		d.errback(CW.UnitTest.SkipTest("skip"));
		return d;
	},

	/* TODO: test Failure in addition to error? */

	function tearDown(self) {
		var d = new goog.async.Deferred();
		self.log += 'tearDown'; d.callback(null);
		return d;
	}
);



CW.UnitTest.TestCase.subclass(CW.Test.GDSMock, '_BadSetUp').methods(
	function __init__(self, methodName) {
		self.log = "";
		CW.Test.GDSMock._BadSetUp.upcall(self, '__init__', [methodName]);
	},

	function setUp(self) {
		var d = new goog.async.Deferred();
		d.errback(new CW.Error("failed setup"));
		return d;
	},

	function test_method(self) {
		var d = new goog.async.Deferred();
		self.log += 'test_method '; d.callback(null);
		return d;
	},

	function tearDown(self) {
		var d = new goog.async.Deferred();
		self.log += 'tearDown'; d.callback(null);
		return d;
	}
);



CW.Test.GDSMock._BadSetUp.subclass(CW.Test.GDSMock, '_SkipTestInSetUp').methods(
	function setUp(self) {
		var d = new goog.async.Deferred();
		d.errback(new CW.UnitTest.SkipTest("skip in setUp"));
		return d;
	}
);



CW.UnitTest.TestCase.subclass(CW.Test.GDSMock, '_BadTearDown').methods(
	function __init__(self, methodName) {
		self.log = "";
		CW.Test.GDSMock._BadTearDown.upcall(self, '__init__', [methodName]);
	},

	function setUp(self) {
		var d = new goog.async.Deferred();
		self.log += 'setUp '; d.callback(null);
		return d;
	},

	function test_method(self) {
		var d = new goog.async.Deferred();
		self.log += 'test_method '; d.callback(null);
		return d;
	},

	function tearDown(self) {
		var d = new goog.async.Deferred();
		d.errback(self.getFailError('deliberate fail in tearDown'));
		return d;
	}
);

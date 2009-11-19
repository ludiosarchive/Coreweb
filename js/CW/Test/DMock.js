/**
 * These are some mock L{TestCase}s that are used by L{TestUnitTest}
 * in order to test the unit testing framework.
 *
 * This file was copy/pasted from Mock.js, and modified to return L{goog.async.Deferred}s.
 */

// import CW.UnitTest

goog.require('goog.async.Deferred');

/**
 * L{TestCase} subclass that we use as the primary subject of our tests in
 * L{TestCaseTest}.
 *
 * L{_WasRun} mostly just keeps track of which methods were called on it.
 */
CW.UnitTest.TestCase.subclass(CW.Test.DMock, '_WasRun').methods(
	function __init__(self, methodName) {
		self.log = "";
		CW.Test.DMock._WasRun.upcall(self, '__init__', [methodName]);
	},

	function setUp(self) {
		var d = new goog.async.Deferred();
		setTimeout(function(){self.log += 'setUp '; d.callback(null);}, 0);
		return d;
	},

	function test_good(self) {
		var d = new goog.async.Deferred();
		setTimeout(function(){self.log += 'test '; d.callback(null);}, 0);
		//CW.msg('installed the setTimeout.');
		return d;
	},

	function test_bad(self) {
		var d = new goog.async.Deferred();
		setTimeout(function(){d.errback(self.getFailError("fail this test deliberately")); }, 0);
		return d;
	},

	function test_error(self) {
		var d = new goog.async.Deferred();
		setTimeout(function(){d.errback(CW.Error("error")); }, 0);
		return d;
	},

	function test_skip(self) {
		var d = new goog.async.Deferred();
		setTimeout(function(){d.errback(CW.UnitTest.SkipTest("skip")); }, 0);
		return d;
	},

	/* TODO: test Failure in addition to error? */

	function tearDown(self) {
		var d = new goog.async.Deferred();
		setTimeout(function(){self.log += 'tearDown'; d.callback(null);}, 0);
		return d;
	}
);



CW.UnitTest.TestCase.subclass(CW.Test.DMock, '_BadSetUp').methods(
	function __init__(self, methodName) {
		self.log = "";
		CW.Test.DMock._BadSetUp.upcall(self, '__init__', [methodName]);
	},

	function setUp(self) {
		var d = new goog.async.Deferred();
		setTimeout(function(){d.errback(new CW.Error("failed setup"));}, 0);
		return d;
	},

	function test_method(self) {
		var d = new goog.async.Deferred();
		setTimeout(function(){self.log += 'test_method '; d.callback(null);}, 0);
		return d;
	},

	function tearDown(self) {
		var d = new goog.async.Deferred();
		setTimeout(function(){self.log += 'tearDown'; d.callback(null);}, 0);
		return d;
	}
);



CW.Test.DMock._BadSetUp.subclass(CW.Test.DMock, '_SkipTestInSetUp').methods(
	function setUp(self) {
		var d = new goog.async.Deferred();
		setTimeout(function(){d.errback(new CW.UnitTest.SkipTest("skip in setUp"));}, 0);
		return d;
	}
);



CW.UnitTest.TestCase.subclass(CW.Test.DMock, '_BadTearDown').methods(
	function __init__(self, methodName) {
		self.log = "";
		CW.Test.DMock._BadTearDown.upcall(self, '__init__', [methodName]);
	},

	function setUp(self) {
		var d = new goog.async.Deferred();
		setTimeout(function(){self.log += 'setUp '; d.callback(null);}, 0);
		return d;
	},

	function test_method(self) {
		var d = new goog.async.Deferred();
		setTimeout(function(){self.log += 'test_method '; d.callback(null);}, 0);
		return d;
	},

	function tearDown(self) {
		var d = new goog.async.Deferred();
		setTimeout(function(){d.errback(self.getFailError('deliberate fail in tearDown')); }, 0);
		return d;
	}
);

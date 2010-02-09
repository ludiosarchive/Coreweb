/**
 * These are some mock L{TestCase}s that are used by L{TestUnitTest}
 * in order to test the unit testing framework.
 *
 * This file was copy/pasted from DMock.js, and modified to fire Deferreds
 * synchronously.
 *
 * "DS" means "Deferred synchronous"
 */

goog.require('cw.UnitTest');
goog.require('goog.async.Deferred');

goog.provide('cw.Test.DSMock');

// anti-clobbering for JScript
(function(){

/**
 * L{TestCase} subclass that we use as the primary subject of our tests in
 * L{TestCaseTest}.
 *
 * L{_WasRun} mostly just keeps track of which methods were called on it.
 */
cw.UnitTest.TestCase.subclass(cw.Test.DSMock, '_WasRun').methods(
	function __init__(self, methodName) {
		self.log = "";
		cw.Test.DSMock._WasRun.upcall(self, '__init__', [methodName]);
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
		d.errback(new Error("error"));
		return d;
	},

	function test_skip(self) {
		var d = new goog.async.Deferred();
		d.errback(new cw.UnitTest.SkipTest("skip"));
		return d;
	},

	/* TODO: test Failure in addition to error? */

	function tearDown(self) {
		var d = new goog.async.Deferred();
		self.log += 'tearDown'; d.callback(null);
		return d;
	}
);



cw.UnitTest.TestCase.subclass(cw.Test.DSMock, '_BadSetUp').methods(
	function __init__(self, methodName) {
		self.log = "";
		cw.Test.DSMock._BadSetUp.upcall(self, '__init__', [methodName]);
	},

	function setUp(self) {
		var d = new goog.async.Deferred();
		d.errback(new Error("failed setup"));
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



cw.Test.DSMock._BadSetUp.subclass(cw.Test.DSMock, '_SkipTestInSetUp').methods(
	function setUp(self) {
		var d = new goog.async.Deferred();
		d.errback(new cw.UnitTest.SkipTest("skip in setUp"));
		return d;
	}
);



cw.UnitTest.TestCase.subclass(cw.Test.DSMock, '_BadTearDown').methods(
	function __init__(self, methodName) {
		self.log = "";
		cw.Test.DSMock._BadTearDown.upcall(self, '__init__', [methodName]);
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

})(); // end anti-clobbering for JScript

/**
 * @fileoverview Some mock TestCass that are used by TestUnitTest
 * 	in order to test the unit testing framework.
 */

goog.provide('cw.Test.Mock');

goog.require('cw.UnitTest');


// anti-clobbering for JScript
(function(){

/**
 * L{TestCase} subclass that we use as the primary subject of our tests in
 * L{TestCaseTest}.
 *
 * L{_WasRun} mostly just keeps track of which methods were called on it.
 */
cw.UnitTest.TestCase.subclass(cw.Test.Mock, '_WasRun').methods(
	function __init__(self, methodName) {
		self.log = "";
		cw.Test.Mock._WasRun.upcall(self, '__init__', [methodName]);
	},

	function setUp(self) {
		self.log += 'setUp ';
	},

	function test_good(self) {
		self.log += 'test ';
	},

	function test_bad(self) {
		self.fail("fail this test deliberately");
	},

	function test_error(self) {
		throw new Error("error");
	},

	function test_skip(self) {
		throw new cw.UnitTest.SkipTest("skip");
	},

	function tearDown(self) {
		self.log += 'tearDown';
	}
);



cw.UnitTest.TestCase.subclass(cw.Test.Mock, '_BadSetUp').methods(
	function __init__(self, methodName) {
		self.log = "";
		cw.Test.Mock._BadSetUp.upcall(self, '__init__', [methodName]);
	},

	function setUp(self) {
		self.fail("failed setup");
	},

	function test_method(self) {
		self.log += 'test_method ';
	},

	function tearDown(self) {
		self.log += 'tearDown';
	}
);



cw.Test.Mock._BadSetUp.subclass(cw.Test.Mock, '_SkipTestInSetUp').methods(
	function setUp(self) {
		throw new cw.UnitTest.SkipTest("skip in setUp");
	}
);



cw.UnitTest.TestCase.subclass(cw.Test.Mock, '_BadTearDown').methods(
	function __init__(self, methodName) {
		self.log = "";
		cw.Test.Mock._BadTearDown.upcall(self, '__init__', [methodName]);
	},

	function setUp(self) {
		self.log += "setUp ";
	},

	function test_method(self) {
		self.log += 'test_method ';
	},

	function tearDown(self) {
		self.fail('deliberate fail in tearDown');
	}
);



cw.UnitTest.TestCase.subclass(cw.Test.Mock, '_setTimeoutLoose').methods(
	function test_method(self) {
		setTimeout(function(){}, 30);
	}
);



cw.UnitTest.TestCase.subclass(cw.Test.Mock, '_setIntervalLoose').methods(
	function test_method(self) {
		self._interval = setInterval(function(){}, 10);
	}
);

})(); // end anti-clobbering for JScript

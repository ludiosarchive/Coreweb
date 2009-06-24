/**
 * L{CW.UnitTest.TestCase}s that are used by L{CW.Test.TestUnitTest}
 * in order to test the unit testing framework.
 *
 * This file was copy/pasted from Mock and changed everywhere to return Deferreds.
 */

// import CW.Defer
// import CW.UnitTest

/**
 * L{TestCase} subclass that we use as the primary subject of our tests in
 * L{TestCaseTest}.
 *
 * L{_WasRun} mostly just keeps track of which methods were called on it.
 */
CW.UnitTest.TestCase.subclass(CW.Test.DMock, '_WasRun').methods(
	function __init__(self, methodName) {
		self.log = "";
		CW.Test.DMock._WasRun.upcall(self, '__init__', methodName);
	},

	function setUp(self) {
		var d = CW.Defer.Deferred();
		setTimeout(function(){self.log += 'setUp '; d.callback(null);}, 10);
		return d;
	},

	function test_good(self) {
		var d = CW.Defer.Deferred();
		setTimeout(function(){self.log += 'test '; d.callback(null);}, 10);
		//print('installed the setTimeout.<br>');
		return d;
	},

	function test_bad(self) {
		var d = CW.Defer.Deferred();
		setTimeout(function(){d.errback(self.getFailError("fail this test deliberately")); }, 10);
		return d;
	},

	function test_error(self) {
		var d = CW.Defer.Deferred();
		setTimeout(function(){d.errback(CW.Error("error")); }, 10);
		return d;
	},

	/* TODO: test Failure in addition to error? */

	function tearDown(self) {
		var d = CW.Defer.Deferred();
		setTimeout(function(){self.log += 'tearDown'; d.callback(null);}, 10);
		return d;
	}
);



CW.UnitTest.TestCase.subclass(CW.Test.DMock, '_BadSetUp').methods(
	function __init__(self, methodName) {
		self.log = "";
		CW.Test.DMock._BadSetUp.upcall(self, '__init__', methodName);
	},

	function setUp(self) {
		var d = CW.Defer.Deferred();
		setTimeout(function(){d.errback(new Error("failed setup"));}, 10);
		return d;
	},

	function test_method(self) {
		var d = CW.Defer.Deferred();
		setTimeout(function(){self.log += 'test_method '; d.callback(null);}, 10);
		return d;
	},

	function tearDown(self) {
		var d = CW.Defer.Deferred();
		setTimeout(function(){self.log += 'tearDown'; d.callback(null);}, 10);
		return d;
	}
);



CW.UnitTest.TestCase.subclass(CW.Test.DMock, '_BadTearDown').methods(
	function __init__(self, methodName) {
		self.log = "";
		CW.Test.DMock._BadTearDown.upcall(self, '__init__', methodName);
	},

	function setUp(self) {
		var d = CW.Defer.Deferred();
		setTimeout(function(){self.log += 'setUp '; d.callback(null);}, 10);
		return d;
	},

	function test_method(self) {
		var d = CW.Defer.Deferred();
		setTimeout(function(){self.log += 'test_method '; d.callback(null);}, 10);
		return d;
	},

	function tearDown(self) {
		var d = CW.Defer.Deferred();
		setTimeout(function(){d.errback(self.getFailError('deliberate fail in tearDown')); }, 10);
		return d;
	}
);



CW.UnitTest.TestCase.subclass(CW.Test.DMock, '_setTimeoutLoose').methods(
	function test_method(self) {
		setTimeout(function(){}, 300);
		var d = CW.Defer.Deferred();
		setTimeout(function(){d.callback(null);}, 10);
		return d;
	}
);



CW.UnitTest.TestCase.subclass(CW.Test.DMock, '_setIntervalLoose').methods(
	function test_method(self) {
		setInterval(function(){}, 10);
		var d = CW.Defer.Deferred();
		setTimeout(function(){d.callback(null);}, 25);
		return d;
	}
);

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
		CW.Test.DMock._WasRun.upcall(self, '__init__', [methodName]);
	},

	function setUp(self) {
		var d = new CW.Defer.Deferred();
		setTimeout(function(){self.log += 'setUp '; d.callback(null);}, 0);
		return d;
	},

	function test_good(self) {
		var d = new CW.Defer.Deferred();
		setTimeout(function(){self.log += 'test '; d.callback(null);}, 0);
		//CW.msg('installed the setTimeout.');
		return d;
	},

	function test_bad(self) {
		var d = new CW.Defer.Deferred();
		setTimeout(function(){d.errback(self.getFailError("fail this test deliberately")); }, 0);
		return d;
	},

	function test_error(self) {
		var d = new CW.Defer.Deferred();
		setTimeout(function(){d.errback(CW.Error("error")); }, 0);
		return d;
	},

	function test_skip(self) {
		var d = new CW.Defer.Deferred();
		setTimeout(function(){d.errback(CW.UnitTest.SkipTest("skip")); }, 0);
		return d;
	},

	/* TODO: test Failure in addition to error? */

	function tearDown(self) {
		var d = new CW.Defer.Deferred();
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
		var d = new CW.Defer.Deferred();
		setTimeout(function(){d.errback(new CW.Error("failed setup"));}, 0);
		return d;
	},

	function test_method(self) {
		var d = new CW.Defer.Deferred();
		setTimeout(function(){self.log += 'test_method '; d.callback(null);}, 0);
		return d;
	},

	function tearDown(self) {
		var d = new CW.Defer.Deferred();
		setTimeout(function(){self.log += 'tearDown'; d.callback(null);}, 0);
		return d;
	}
);



CW.UnitTest.TestCase.subclass(CW.Test.DMock, '_BadTearDown').methods(
	function __init__(self, methodName) {
		self.log = "";
		CW.Test.DMock._BadTearDown.upcall(self, '__init__', [methodName]);
	},

	function setUp(self) {
		var d = new CW.Defer.Deferred();
		setTimeout(function(){self.log += 'setUp '; d.callback(null);}, 0);
		return d;
	},

	function test_method(self) {
		var d = new CW.Defer.Deferred();
		setTimeout(function(){self.log += 'test_method '; d.callback(null);}, 0);
		return d;
	},

	function tearDown(self) {
		var d = new CW.Defer.Deferred();
		setTimeout(function(){d.errback(self.getFailError('deliberate fail in tearDown')); }, 0);
		return d;
	}
);



CW.UnitTest.TestCase.subclass(CW.Test.DMock, '_setTimeoutLoose').methods(
	function test_method(self) {
		setTimeout(function(){}, 30); // was 300
		var d = new CW.Defer.Deferred();
		setTimeout(function(){d.callback(null);}, 0);
		return d;
	}
);



CW.UnitTest.TestCase.subclass(CW.Test.DMock, '_setIntervalLoose').methods(
	function test_method(self) {
		setInterval(function(){}, 0);
		var d = new CW.Defer.Deferred();
		setTimeout(function(){d.callback(null);}, 25);
		return d;
	}
);

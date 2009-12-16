/**
 * Tests for CW.__init__
 */

// import CW.UnitTest

goog.require('goog.userAgent');
goog.require('goog.array');


CW.UnitTest.TestCase.subclass(CW.Test.TestBase, 'ArraysEqualTests').methods(
	/**
	 * Check that arrays which contain identical elements are considered
	 * equal.
	 */
	function test_arraysEqualPositive(self) {
		self.assert(goog.array.equals([], []));
		self.assert(goog.array.equals([1, 2], [1, 2]));
		var x = {a: 1, b: 2};
		self.assert(goog.array.equals([x, 3], [x, 3]));
	},


	/**
	 * Check that arrays with contain different elements are not
	 * considered equal.
	 */
	function test_arraysEqualNegative(self) {
		self.assert(!goog.array.equals([], [null]));
		self.assert(!goog.array.equals([1], [2]));
		self.assert(!goog.array.equals({'a': undefined}, {'b': 2}));
		self.assert(!goog.array.equals(
						function() { return 1; },
						function() { return 2; }));
	},


	/**
	 * Check that sparse arrays with contain different elements are not
	 * considered equal.
	 */
	function test_arraysSparseEqualNegative(self) {
		self.assert(!goog.array.equals([1,"2",undefined,10], [1,"2",undefined,11]));
	},


	/**
	 * Check that truly sparse arrays with contain different elements are not
	 * considered equal.
	 */
	function test_arraysTrulySparseEqualNegative(self) {
		var a1 = [1,"2"];
		a1[3] = 10;

		var a2 = [1,"2"];
		a2[3] = 11;
		self.assert(!goog.array.equals(a1, a2));
	},


	/**
	 * Check that different arrays with missing elements are not considered
	 * equal.
	 */
	function test_missingElements(self) {
		var a = [];
		var b = [];
		a[3] = '3';
		b[3] = '3';
		b[2] = '2';
		self.assert(!goog.array.equals(a, b));
	}
);



CW.UnitTest.TestCase.subclass(CW.Test.TestBase, 'StartsWithTests').methods(
	/**
	 * Check that startswith works as expected.
	 */
	function test_startswith(self) {
		self.assert(CW.startswith("hello", "h"));
		self.assert(CW.startswith("hello", ""));
		self.assert(CW.startswith("hello", "hell"));
		self.assert(CW.startswith("hello", "hello"));
		self.assert(!CW.startswith("something else", "not related"));
		self.assert(!CW.startswith("not related", "something else"));
		self.assert(!CW.startswith("hello", "hello!"));
		self.assertThrows(Error, function(){self.assert(!CW.startswith(null, "hello"));});
		self.assertThrows(Error, function(){self.assert(!CW.startswith("hello", null));});
		self.assertThrows(Error, function(){self.assert(!CW.startswith(undefined, "hello"));});
		self.assertThrows(Error, function(){self.assert(!CW.startswith("hello", undefined));});
		self.assert(!CW.startswith("3he", 3));
		self.assertThrows(Error, function(){CW.startswith(3, "3");});
		self.assertThrows(Error, function(){CW.startswith(33, "33");});
		self.assertThrows(Error, function(){CW.startswith(33, "3");});
	}
);


/**
 * Check that CW.assert works.
 */
CW.UnitTest.TestCase.subclass(CW.Test.TestBase, 'AssertTests').methods(

	function test_assertPositive(self) {
		CW.assert(true);
		CW.assert(true, "test_assertPositive message");
	},


	function test_assertNegative(self) {
		self.assertThrows(
			CW.AssertionError,
			function(){CW.assert(false)}
		);

		self.assertThrows(
			CW.AssertionError,
			function(){CW.assert(false, "test_assertNegative message")},
			"test_assertNegative message"
		);
	}
);


CW.UnitTest.TestCase.subclass(CW.Test.TestBase, 'TestInspect').methods(
	/**
	 * Test that L{CW.methods} returns all the methods of a class
	 * object.
	 */
	function test_methods(self) {

		/* CW.Class has no visible toString method for some reason.  If this
		 * ever changes, feel free to change this test.
		 */
		self.assertArraysEqual(CW.methods(CW.Class),
							   ["__init__"]);

		var TestClass = CW.Class.subclass("test_inspect.test_methods.TestClass");
		TestClass.methods(function method() {});

		/* Subclasses get two methods automagically, __init__ and toString.  If
		 * this ever changes, feel free to change this test.
		 */

		// as for IE, there may be related info about this bug at:
		// http://www.nabble.com/IE-and-the-%27toString%27-property---inheritance-issues-td10761491.html

		if(!goog.userAgent.IE) {
			self.assertArraysEqual(CW.methods(TestClass),
							   ["__init__", "method", "toString"]);
		} else {
			self.assertArraysEqual(CW.methods(TestClass),
							   ["__init__", "method"]);
		}

		var TestSubclass = TestClass.subclass("test_inspect.test_methods.TestSubclass");
		TestSubclass.methods(function anotherMethod() {});

		if(!goog.userAgent.IE) {
			self.assertArraysEqual(CW.methods(TestSubclass),
								   ["__init__", "anotherMethod", "method", "toString"]);
		} else {
			self.assertArraysEqual(CW.methods(TestSubclass),
								   ["__init__", "anotherMethod", "method"]);
		}
	},


	/**
	 * Test that an appropriate exception is raised if the methods of an instance
	 * are requested.
	 */
	function test_methodsAgainstInstance(self) {
		var msg = "Only classes have methods.";
		var error;

		var invalids=[{}, {}, 0, "", CW.Class()];
		var n=invalids.length;
		while(n--) {
			error = self.assertThrows(
				Error,
				function() {
					return CW.methods(invalids[n]);
				});
			self.assertErrorMessage(error, msg);
		}
	}
);

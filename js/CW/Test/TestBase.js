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
 * Check that split works as expected.
 */
CW.UnitTest.TestCase.subclass(CW.Test.TestBase, 'SplitTests').methods(
	function test_splitUnlimited(self) {
		self.assertArraysEqual(["", "ello"], CW.split("hello", "h"));
		self.assertArraysEqual(["", ""], CW.split("hello", "hello"));
		self.assertArraysEqual(["", "ello", "ello"], CW.split("hellohello", "h"));
		self.assertArraysEqual(["1", "2", "3"], CW.split("1xy2xy3", "xy"));
	},


	function test_splitLimited(self) {
		self.assertArraysEqual(["one", "two_three"], CW.split("one_two_three", "_", 1));
		self.assertArraysEqual(["1", "2", "3", "4"], CW.split("1_2_3_4", "_", 3));
		self.assertArraysEqual(["1", "2", "3", "4_5"], CW.split("1_2_3_4_5", "_", 3));
		self.assertArraysEqual(["1", "2", "3", "4__5"], CW.split("1__2__3__4__5", "__", 3));
	},


	function test_splitLimitedEdgeCase(self) {
		self.assertArraysEqual(["hello"], CW.split("hello", "_", 1));
		self.assertArraysEqual(["hello", ""], CW.split("hello_", "_", 1));
		self.assertArraysEqual(["hello", "world", ""], CW.split("hello_world_", "_", 2));
		self.assertArraysEqual(["hello", "world_"], CW.split("hello_world_", "_", 1));
	},


	function test_splitZero(self) {
		self.assertArraysEqual(["hello"], CW.split("hello", "h", 0));
		self.assertArraysEqual(["1x2x3"], CW.split("1x2x3", "x", 0));
	},


	function test_pythonCompat(self) {
		// Numbers less than 0 act like not passing in a C{maxsplit}
		self.assertArraysEqual(["", "ello"], CW.split("hello", "h", -1));
		self.assertArraysEqual(["xx", "yy", "zz"], CW.split("xx_yy_zz", "_", -1));
		self.assertArraysEqual(["xx", "yy", "zz"], CW.split("xx_yy_zz", "_", -2));
		self.assertArraysEqual(["xx", "yy", "zz"], CW.split("xx_yy_zz", "_", -3));
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


/**
 * Check that CW.format works.
 */
CW.UnitTest.TestCase.subclass(CW.Test.TestBase, 'FormatTests').methods(

	function test_format(self) {
		self.assertEqual("hello", CW.format("hell{0}", "o"));
		self.assertEqual("hello world", CW.format("hell{0}{1}", "o", " world"));
	},


	/**
	 * CW.format works beyond 10 parameters.
	 * (at least 2 digits are supported)
	 */
	function test_noLimitOf10(self) {
		self.assertEqual("abcdefghijk",
			CW.format(
				"{0}{1}{2}{3}{4}{5}{6}{7}{8}{9}{10}",
				"a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k"));
	},


	function test_formatNoSubstitutions(self) {
		self.assertEqual("hello", CW.format("hello"));
		self.assertEqual("hello{}", CW.format("hello{}"));
		self.assertEqual("{}hello", CW.format("{}hello"));
		self.assertEqual("{}hello", CW.format("{}hello", "ignored-param"));
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

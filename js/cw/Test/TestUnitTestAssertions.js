/**
 * @fileoverview Tests for cw.UnitTest's assertion functions
 */

goog.provide('cw.Test.TestUnitTestAssertions');

goog.require('cw.UnitTest');
goog.require('cw.eq');
goog.require('goog.async.Deferred');
goog.require('goog.async.DeferredList');
goog.require('goog.debug.Error');


// anti-clobbering for JScript; aliases
(function() {

var plainObject = cw.eq.plainObject;

/**
 * Just for testing.
 *
 * @param {string=} opt_msg Optional message.
 * @constructor
 * @extends {goog.debug.Error}
 */
cw.Test.TestUnitTestAssertions.SpecialError = function(opt_msg) {
	goog.debug.Error.call(this, opt_msg);
};
goog.inherits(cw.Test.TestUnitTestAssertions.SpecialError, goog.debug.Error);
cw.Test.TestUnitTestAssertions.SpecialError.prototype.name = 'cw.Test.TestUnitTestAssertions.SpecialError';



cw.UnitTest.TestCase.subclass(cw.Test.TestUnitTestAssertions, '_StartsWithUnderscore').methods(
	function test_nothing(self) {

	}
);


cw.UnitTest.TestCase.subclass(cw.Test.TestUnitTestAssertions, 'EndsWithUnderscore_').methods(
	function test_nothing(self) {

	}
);



/**
 * Tests for assertions in L{cw.UnitTest.TestCase}.
 */
cw.UnitTest.TestCase.subclass(cw.Test.TestUnitTestAssertions, 'AssertionTests').methods(
	/**
	 * Test that L{assert} raises an exception if its expression is false.
	 */
	function test_assert(self) {
		self.assertThrows(
			cw.UnitTest.AssertionError,
			function() { self.assertTrue(false, "message"); }
		);
	},


	/**
	 * Test that L{neverHappen} raises an exception.
	 */
	function test_neverHappen(self) {
		self.assertThrows(
			cw.UnitTest.AssertionError,
			function() { self.neverHappen(); }
		);
	},


	/**
	 * Test assertFailure with immediate error
	 */
	function test_assertFailureImmediate(self) {
		var d = new goog.async.Deferred();
		d.errback(Error("Throwing an Error.")); // right now
		self.assertFailure(d, [Error]);
		return d;
	},


	/**
	 * Test assertFailure (previous not tested anywhere, including Athena)
	 */

	function test_assertFailureDelayed(self) {
		var d = new goog.async.Deferred();
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
				cw.UnitTest.AssertionError,
				function() { throw new cw.UnitTest.AssertionError('', []); }
			);
		} catch (e) {
			self.fail("assertThrows should have passed: " + e.message);
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
				cw.UnitTest.AssertionError,
				function() {}
			);
			raised = false;
		} catch (e) {
			if (!(e instanceof cw.UnitTest.AssertionError)) {
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
				cw.UnitTest.AssertionError,
				function() {}, "this message will never be cared about");
			raised = false;
		} catch (e) {
			if (!(e instanceof cw.UnitTest.AssertionError)) {
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
		var raised = true;
		try {
			self.assertThrows(
				cw.UnitTest.AssertionError,
				function() { throw new cw.Test.TestUnitTestAssertions.SpecialError(); }
			);
			raised = false;
		} catch (e) {
			if (!(e instanceof cw.UnitTest.AssertionError)) {
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
		try {
			self.assertThrows(cw.Test.TestUnitTestAssertions.SpecialError,
							  function() { throw new cw.Test.TestUnitTestAssertions.SpecialError("correct message"); }, "wrong message");
			raised = false;
		} catch (e) {
			if (!(e instanceof cw.UnitTest.AssertionError)) {
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
			cw.UnitTest.AssertionError,
			function() {
				self.compare(
					function (a, b) { return a === b; },
					"!==", "a", "b"
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
			self.assertErrorMessage(e, '[0] "a" <-> "b"');
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
			self.assertErrorMessage(e, '[0] "a" <-> "b": Hello');
		}
	},


	/**
	 * Test that L{assertIdentical} raises an exception if its arguments are
	 * unequal, and that the message of the raised exception contains the
	 * arguments.
	 */
	function test_assertIdenticalNegative(self) {
		var e = self.assertThrows(
			cw.UnitTest.AssertionError,
			function() {
				self.assertIdentical('apple', 'orange');
			}
		);
		self.assertErrorMessage(e,
			'[0] "apple" `!==´ "orange"');
	},


	/**
	 * If L{assertIdentical} is given a message as an optional third argument,
	 * that message should appear in the raised exception's message. Test this.
	 */
	function test_assertIdenticalNegativeWithMessage(self) {
		try {
			self.assertIdentical('apple', 'orange', 'some message');
		} catch (e) {
			self.assertErrorMessage(
				e,
				'[0] "apple" `!==´ "orange": some message'
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
			cw.UnitTest.AssertionError,
			function() {
				self.assertIdentical(1, '1');
			}
		);
		self.assertErrorMessage(
			e,
			'[0] 1 `!==´ "1"');
	},


	/**
	 * If L{assertNotIdentical} is given a message as an optional third argument,
	 * that message should appear in the raised exception's message. Test this.
	 */
	function test_assertNotIdenticalNegativeWithMessage(self) {
		try {
			self.assertNotIdentical('apple', 'apple', 'some message');
		} catch (e) {
			self.assertErrorMessage(
				e,
				'[0] "apple" `===´ "apple": some message'
			);
		}
	},


	/**
	 * Test that L{assertNotIdentical} doesn't raise an exception if its
	 * arguments are unequal.
	 */
	function test_assertNotIdenticalPositive(self) {
		self.assertNotIdentical('apple', 'orange');
	},


	/**
	 * Test that L{assertNotIdentical} thinks that 1 and '1' are unequal.
	 */
	function test_assertNotIdenticalDifferentTypes(self) {
		self.assertNotIdentical(1, '1');
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
			cw.UnitTest.AssertionError,
			function() {
				self.assertArraysEqual([1, 2], [1, 2, 3]);
			}
		);
		self.assertThrows(
			cw.UnitTest.AssertionError,
			function() {
				self.assertArraysEqual({'foo': 2}, [2]);
			}
		);
		self.assertThrows(
			cw.UnitTest.AssertionError,
			function() {
				self.assertArraysEqual(1, [1]);
			}
		);
		self.assertThrows(
			cw.UnitTest.AssertionError,
			function() {
				self.assertArraysEqual(
					function() { return 1; },
					function() { return 2; }
				);
			}
		);
		self.assertThrows(
			cw.UnitTest.AssertionError,
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
		self.assertThrows(
			cw.UnitTest.AssertionError,
			function() {
				self.assertArraysNotEqual([1, 2, 3], [1, 2, 3]);
			}
		);
		self.assertThrows(
			cw.UnitTest.AssertionError,
			function() {
				self.assertArraysNotEqual([2], [2]);
			}
		);
		self.assertThrows(
			cw.UnitTest.AssertionError,
			function() {
				self.assertArraysNotEqual([], []);
			}
		);
	},


	/**
	 * Test that two equal arrays are not identical, and that an object is
	 * identical to itself.
	 */
	function test_assertIdentical(self) {
		var foo = [1, 2];
		self.assertIdentical(foo, foo);
		self.assertThrows(
			cw.UnitTest.AssertionError,
			function() { self.assertIdentical(foo, [1, 2]); }
		);
	},


	/**
	 * Test that L{assertIn} works in the positive.
	 */
	function test_assertIn(self) {
		self.assertIn("1", [5, 6]);
		self.assertIn("hello", {"hello": "world"});
	},


	/**
	 * Test that L{assertIn} works in the negative.
	 */
	function test_assertInNegative(self) {
		var e = self.assertThrows(
			cw.UnitTest.AssertionError,
			function() {
				self.assertIn("1", [5]);
			}
		);
		self.assertErrorMessage(e, '[0] "1" `not in´ [5]');
	},


	/**
	 * Test that L{assertNotIn} works in the positive.
	 */
	function test_assertNotIn(self) {
		self.assertNotIn("2", [5, 6]);
		self.assertNotIn("x", {"hello": "world"});
	},


	/**
	 * Test that L{assertNotIn} works in the negative.
	 */
	function test_assertNotInNegative(self) {
		var e = self.assertThrows(
			cw.UnitTest.AssertionError,
			function() {
				self.assertNotIn("0", [5]);
			}
		);
		self.assertErrorMessage(e, '[0] "0" `in´ [5]');
	},


	function test_assertEqual(self) {
		function a() {}

		self.assertEqual("2", "2");
		var big = "big";
		self.assertEqual(big, big);

		self.assertEqual([], []);
		self.assertEqual([[]], [[]]);
		self.assertEqual([[], []], [[], []]);
		self.assertEqual([[1], [3]], [[1], [3]]);
		self.assertEqual([[1], [3, [plainObject({})]]], [[1], [3, [plainObject({})]]]);
		self.assertEqual([[1], [3, [plainObject({})]]], [[1], [3, [plainObject(new Object())]]]);

		self.assertEqual(null, null);
		self.assertEqual(undefined, undefined);
		self.assertEqual(true, true);
		self.assertEqual(false, false);

		self.assertEqual(a, a);
	},


	function test_assertEqualNegative(self) {
		function aT(f) {
			self.assertThrows(cw.UnitTest.AssertionError, f);
		}

		function a() {}
		function b() {}

		aT(function() { self.assertEqual("2", 2); });
		var big = "big";
		aT(function() { self.assertEqual(big, "bigg"); });

		var longer = []
		longer.length = 1;
		aT(function() { self.assertEqual([], longer); });

		aT(function() { self.assertEqual([[]], [[[]]]); });
		aT(function() { self.assertEqual([[], []], [[], [], null]); });
		aT(function() { self.assertEqual([[1], [3]], [[3], [1]]); });
		aT(function() { self.assertEqual([[1], [3, [{}]]], [[1], [3, [{n: 1}]]]); });

		aT(function() { self.assertEqual({}, null); });
		aT(function() { self.assertEqual(null, {}); });
		aT(function() { self.assertEqual(undefined, null); });
		aT(function() { self.assertEqual(null, undefined); });
		aT(function() { self.assertEqual(true, false); });
		aT(function() { self.assertEqual(false, true); });

		aT(function() { self.assertEqual(
			plainObject({1: 3}),
			plainObject({1: 3.00001})); });

		aT(function() { self.assertEqual(a, b); });
	},


	function test_assertNotEqual(self) {
		self.assertNotEqual(false, true);
		self.assertNotEqual([1, 4], [1, 5]);
	},


	function test_assertNotEqualNegative(self) {
		function aT(f) {
			self.assertThrows(cw.UnitTest.AssertionError, f);
		}

		aT(function() { self.assertNotEqual(false, false); });
		aT(function() { self.assertNotEqual([1, 4], [1, 4]); });
	}

	// TODO: make sure [[DontEnum]]-shadowed properties are compared
	// in IE6-IE8.
);

})(); // end anti-clobbering for JScript

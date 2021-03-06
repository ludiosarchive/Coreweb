/**
 * @fileoverview Tests for cw.string
 */

goog.provide('cw.Test.TestString');

goog.require('cw.UnitTest');
goog.require('cw.string');


// anti-clobbering for JScript
(function() {

/**
 * Check that split works as expected.
 */
cw.UnitTest.TestCase.subclass(cw.Test.TestString, 'SplitTests').methods(
	function test_splitUnlimited(self) {
		self.assertArraysEqual(["", "ello"], cw.string.split("hello", "h"));
		self.assertArraysEqual(["", ""], cw.string.split("hello", "hello"));
		self.assertArraysEqual(["", "ello", "ello"], cw.string.split("hellohello", "h"));
		self.assertArraysEqual(["1", "2", "3"], cw.string.split("1xy2xy3", "xy"));
	},


	function test_splitLimited(self) {
		self.assertArraysEqual(["one", "two_three"], cw.string.split("one_two_three", "_", 1));
		self.assertArraysEqual(["1", "2", "3", "4"], cw.string.split("1_2_3_4", "_", 3));
		self.assertArraysEqual(["1", "2", "3", "4_5"], cw.string.split("1_2_3_4_5", "_", 3));
		self.assertArraysEqual(["1", "2", "3", "4__5"], cw.string.split("1__2__3__4__5", "__", 3));
	},


	function test_splitLimitedEdgeCase(self) {
		self.assertArraysEqual(["hello"], cw.string.split("hello", "_", 1));
		self.assertArraysEqual(["hello", ""], cw.string.split("hello_", "_", 1));
		self.assertArraysEqual(["hello", "world", ""], cw.string.split("hello_world_", "_", 2));
		self.assertArraysEqual(["hello", "world_"], cw.string.split("hello_world_", "_", 1));
	},


	function test_splitZero(self) {
		self.assertArraysEqual(["hello"], cw.string.split("hello", "h", 0));
		self.assertArraysEqual(["1x2x3"], cw.string.split("1x2x3", "x", 0));
	},


	function test_pythonCompat(self) {
		// Numbers less than 0 act like not passing in a C{maxsplit}
		self.assertArraysEqual(["", "ello"], cw.string.split("hello", "h", -1));
		self.assertArraysEqual(["xx", "yy", "zz"], cw.string.split("xx_yy_zz", "_", -1));
		self.assertArraysEqual(["xx", "yy", "zz"], cw.string.split("xx_yy_zz", "_", -2));
		self.assertArraysEqual(["xx", "yy", "zz"], cw.string.split("xx_yy_zz", "_", -3));
	}
);



/**
 * Check that rsplit works as expected.
 */
cw.UnitTest.TestCase.subclass(cw.Test.TestString, 'RSplitTests').methods(
	function test_splitUnlimited(self) {
		self.assertArraysEqual(["", "ello"], cw.string.rsplit("hello", "h"));
		self.assertArraysEqual(["", ""], cw.string.rsplit("hello", "hello"));
		self.assertArraysEqual(["", "ello", "ello"], cw.string.rsplit("hellohello", "h"));
		self.assertArraysEqual(["1", "2", "3"], cw.string.rsplit("1xy2xy3", "xy"));
	},


	function test_splitLimited(self) {
		self.assertArraysEqual(["one_two", "three"], cw.string.rsplit("one_two_three", "_", 1));
		self.assertArraysEqual(["1", "2", "3", "4"], cw.string.rsplit("1_2_3_4", "_", 3));
		self.assertArraysEqual(["1_2", "3", "4", "5"], cw.string.rsplit("1_2_3_4_5", "_", 3));
		self.assertArraysEqual(["1__2", "3", "4", "5"], cw.string.rsplit("1__2__3__4__5", "__", 3));
	},


	function test_splitLimitedEdgeCase(self) {
		self.assertArraysEqual(["hello"], cw.string.rsplit("hello", "_", 1));
		self.assertArraysEqual(["hello", ""], cw.string.rsplit("hello_", "_", 1));
		self.assertArraysEqual(["hello", "world", ""], cw.string.rsplit("hello_world_", "_", 2));
		self.assertArraysEqual(["hello_world", ""], cw.string.rsplit("hello_world_", "_", 1));
	},


	function test_splitZero(self) {
		self.assertArraysEqual(["hello"], cw.string.rsplit("hello", "h", 0));
		self.assertArraysEqual(["1x2x3"], cw.string.rsplit("1x2x3", "x", 0));
	},


	function test_pythonCompat(self) {
		// Numbers less than 0 act like not passing in a C{maxsplit}
		self.assertArraysEqual(["", "ello"], cw.string.rsplit("hello", "h", -1));
		self.assertArraysEqual(["xx", "yy", "zz"], cw.string.rsplit("xx_yy_zz", "_", -1));
		self.assertArraysEqual(["xx", "yy", "zz"], cw.string.rsplit("xx_yy_zz", "_", -2));
		self.assertArraysEqual(["xx", "yy", "zz"], cw.string.rsplit("xx_yy_zz", "_", -3));
	}
);



/**
 * Check that cw.string.format works.
 */
cw.UnitTest.TestCase.subclass(cw.Test.TestString, 'FormatTests').methods(

	function test_format(self) {
		self.assertEqual("hello", cw.string.format("hell{0}", "o"));
		self.assertEqual("hello world", cw.string.format("hell{0}{1}", "o", " world"));
	},


	function test_formatOutOfOrder(self) {
		self.assertEqual("hell worldo yay", cw.string.format("hell{1}{0} {2}", "o", " world", "yay", "ignored-param"));
	},

	/**
	 * cw.string.format works beyond 10 parameters.
	 * (at least 2 digits are supported)
	 */
	function test_noLimitOf10(self) {
		self.assertEqual("abcdefghijk",
			cw.string.format(
				"{0}{1}{2}{3}{4}{5}{6}{7}{8}{9}{10}",
				"a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k"));
	},


	function test_formatNoSubstitutions(self) {
		self.assertEqual("hello", cw.string.format("hello"));
		self.assertEqual("hello{}", cw.string.format("hello{}"));
		self.assertEqual("{}hello", cw.string.format("{}hello"));
		self.assertEqual("{}hello", cw.string.format("{}hello", "ignored-param"));
	}
);



cw.UnitTest.TestCase.subclass(cw.Test.TestString, 'StartsWithAltTests').methods(
	/**
	 * Check that startswith works as expected.
	 */
	function test_startswith(self) {
		self.assertTrue(cw.string.startsWithAlt("hello", "h"));
		self.assertTrue(cw.string.startsWithAlt("hello", ""));
		self.assertTrue(cw.string.startsWithAlt("hello", "hell"));
		self.assertTrue(cw.string.startsWithAlt("hello", "hello"));
		self.assertFalse(cw.string.startsWithAlt("something else", "not related"));
		self.assertFalse(cw.string.startsWithAlt("not related", "something else"));
		self.assertFalse(cw.string.startsWithAlt("hello", "hello!"));
		self.assertThrows(Error, function() {self.assertFalse(cw.string.startsWithAlt(null, "hello"));});
		self.assertThrows(Error, function() {self.assertFalse(cw.string.startsWithAlt("hello", null));});
		self.assertThrows(Error, function() {self.assertFalse(cw.string.startsWithAlt(undefined, "hello"));});
		self.assertThrows(Error, function() {self.assertFalse(cw.string.startsWithAlt("hello", undefined));});
		self.assertFalse(cw.string.startsWithAlt("3he", 3));
		self.assertThrows(Error, function() {cw.string.startsWithAlt(3, "3");});
		self.assertThrows(Error, function() {cw.string.startsWithAlt(33, "33");});
		self.assertThrows(Error, function() {cw.string.startsWithAlt(33, "3");});
	}
);



cw.UnitTest.TestCase.subclass(cw.Test.TestString, 'WithoutLastTests').methods(

	function test_withoutLast(self) {
		self.assertIdentical("hell", cw.string.withoutLast("hello", 1));
		self.assertIdentical("hello", cw.string.withoutLast("hello", 0));
		self.assertIdentical("", cw.string.withoutLast("hello", 5));
	},


	function test_withoutLastRemoveTooMuch(self) {
		self.assertIdentical("", cw.string.withoutLast("hello", 6));
		self.assertIdentical("", cw.string.withoutLast("", 1));
	}
);



cw.UnitTest.TestCase.subclass(cw.Test.TestString, 'Regexps').methods(

	function test_strictNonNegIntegerRe(self) {
		self.assertTrue(cw.string.strictNonNegIntegerRe.test('0'));
		self.assertTrue(cw.string.strictNonNegIntegerRe.test('1'));
		self.assertTrue(cw.string.strictNonNegIntegerRe.test('10'));
		self.assertFalse(cw.string.strictNonNegIntegerRe.test('-0'));
		self.assertFalse(cw.string.strictNonNegIntegerRe.test('03'));
		self.assertFalse(cw.string.strictNonNegIntegerRe.test('033'));
		self.assertFalse(cw.string.strictNonNegIntegerRe.test('00'));
	}
);



})(); // end anti-clobbering for JScript

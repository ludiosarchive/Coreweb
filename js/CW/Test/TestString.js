// import CW.UnitTest

goog.require('cw.string');

/**
 * Check that split works as expected.
 */
CW.UnitTest.TestCase.subclass(CW.Test.TestString, 'SplitTests').methods(
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
 * Check that cw.string.format works.
 */
CW.UnitTest.TestCase.subclass(CW.Test.TestString, 'FormatTests').methods(

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



CW.UnitTest.TestCase.subclass(CW.Test.TestString, 'StartsWithAltTests').methods(
	/**
	 * Check that startswith works as expected.
	 */
	function test_startswith(self) {
		self.assert(cw.string.startsWithAlt("hello", "h"));
		self.assert(cw.string.startsWithAlt("hello", ""));
		self.assert(cw.string.startsWithAlt("hello", "hell"));
		self.assert(cw.string.startsWithAlt("hello", "hello"));
		self.assert(!cw.string.startsWithAlt("something else", "not related"));
		self.assert(!cw.string.startsWithAlt("not related", "something else"));
		self.assert(!cw.string.startsWithAlt("hello", "hello!"));
		self.assertThrows(Error, function(){self.assert(!cw.string.startsWithAlt(null, "hello"));});
		self.assertThrows(Error, function(){self.assert(!cw.string.startsWithAlt("hello", null));});
		self.assertThrows(Error, function(){self.assert(!cw.string.startsWithAlt(undefined, "hello"));});
		self.assertThrows(Error, function(){self.assert(!cw.string.startsWithAlt("hello", undefined));});
		self.assert(!cw.string.startsWithAlt("3he", 3));
		self.assertThrows(Error, function(){cw.string.startsWithAlt(3, "3");});
		self.assertThrows(Error, function(){cw.string.startsWithAlt(33, "33");});
		self.assertThrows(Error, function(){cw.string.startsWithAlt(33, "3");});
	}
);

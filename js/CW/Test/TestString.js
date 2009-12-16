// import CW.UnitTest

goog.require('cw.string');

/**
 * Check that split works as expected.
 */
CW.UnitTest.TestCase.subclass(CW.Test.TestBase, 'SplitTests').methods(
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



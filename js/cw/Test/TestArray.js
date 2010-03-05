goog.require('cw.UnitTest');
goog.require('cw.array');

goog.provide('cw.Test.TestArray');

// anti-clobbering for JScript
(function(){


/**
 * Tests for L{cw.array.uniq}
 */
cw.UnitTest.TestCase.subclass(cw.Test.TestArray, 'UniqTests').methods(

	function test_returnsArray(self) {
		var a = [3, 2];
		var b = cw.array.uniq(a);
		self.assert(b.length !== undefined);
	},

	function test_noMutation(self) {
		var a = [3, 3, 2];
		cw.array.uniq(a);
		self.assertEqual([3, 3, 2], a);
	},

	// "at end", "in middle", "at start" refer to the sorted array.

	function test_numbersDupesAtEnd(self) {
		var a = [3, 3, 2, 0, -2];
		var b = cw.array.uniq(a);
		self.assertEqual([-2, 0, 2, 3], b);
	},


	function test_numbersDupesInMiddle(self) {
		var a = [3, 3, 2, 2, 0, -2];
		var b = cw.array.uniq(a);
		self.assertEqual([-2, 0, 2, 3], b);
	},


	function test_numbersDupesAtStart(self) {
		var a = [3, 3, 2, 0, -2, -2, -2];
		var b = cw.array.uniq(a);
		self.assertEqual([-2, 0, 2, 3], b);
	},


	function test_numbersAndStrings(self) {
		var a = [3, 3, 2, 0, -2, '2', '3', 3, '3', '3', 3, 3, 3, '3', 3, '3', 3, 3.0, 3.0];
		var b = cw.array.uniq(a);
		// How strings and numbers are mixed in a sorted array varies accross browsers,
		// so we'll just check the length.
		self.assertEqual(6, b.length, "uniq'ed: " + cw.UnitTest.repr(b));
	},


	function test_strings(self) {
		var a = ['2', '2', '2'];
		var b = cw.array.uniq(a);
		self.assertEqual(['2'], b);
	},


	function test_other(self) {
		var a = [null, undefined, NaN, Infinity, true, false];
		var b = cw.array.uniq(a);
		self.assertEqual(6, b.length);
	},


	function test_otherWithDupes(self) {
		var a = [true, null, undefined, NaN, false, Infinity, undefined, true, false];
		var b = cw.array.uniq(a);
		self.assertEqual(6, b.length);
	},

	/**
	 * null, arrays, and Objects are all typeof 'object', but this must not confuse
	 * the sort function.
	 */
	function test_nullArrayAndObject(self) {
		var a = [null, [], 3, 3, 5, 3, 1000000, null, new Object(), null, new Object(), null, null, new Object(), new Object()];
		var b = cw.array.uniq(a);
		self.assertEqual(9, b.length);
	}
);

})();

/**
 * Tests for CW.__init__
 */

goog.require('cw.UnitTest');

goog.require('goog.userAgent');
goog.require('goog.array');


cw.UnitTest.TestCase.subclass(CW.Test.TestBase, 'ArraysEqualTests').methods(
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

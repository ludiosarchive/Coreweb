/**
 * @fileoverview Tests for cw.eq
 */

goog.provide('cw.Test.TestEq');

goog.require('cw.UnitTest');
goog.require('cw.eq');
goog.require('cw.repr');
goog.require('goog.array');


// anti-clobbering for JScript; aliases
(function() {

var equals = cw.eq.equals;
var plainObject = cw.eq.plainObject;
var plainObjectRecursive = cw.eq.plainObjectRecursive;


// Note: cw.eq is also indirectly tested by cw.Test.TestUnitTestAssertions
// TODO: move some of those tests here
// TODO: copy some tests from goog.testing.asserts
// TODO: tests for custom .equals() behavior
// TODO: make sure those custom `equals` methods can push messages

cw.UnitTest.TestCase.subclass(cw.Test.TestEq, 'PlainObjectTests').methods(
	/**
	 * If only the left side has been marked by plainObject, the objects
	 * are not equal.
	 */
	function test_plainObjectOnlyLeft(self) {
		var one = {};
		var two = {};
		plainObject(one);
		self.assertFalse(cw.eq.equals(one, two));
	},

	/**
	 * If only the right side has been marked by plainObject, the objects
	 * are not equal.
	 */
	function test_plainObjectOnlyRight(self) {
		var one = {};
		var two = {};
		plainObject(two);
		self.assertFalse(cw.eq.equals(one, two));
	},

	/**
	 * If both the left and right side have been marked by plainObject
	 * and the objects have the same properties/values, the objects
	 * are equal.
	 */
	function test_plainObjectBoth(self) {
		var one = plainObject({'x': 1});
		var two = plainObject({});
		self.assertFalse(cw.eq.equals(one, two));
		two['x'] = 1;
		self.assertTrue(cw.eq.equals(one, two));
	},

	/**
	 * plainObject attaches a function __isPlainObject__ which returns
	 * {@code true}.
	 */
	function test_plainObjectAttachesFunction(self) {
		var one = {'x': 1};
		self.assertIdentical(undefined, one.__isPlainObject__); // sanity check
		plainObject(one);
		self.assertIdentical(true, one.__isPlainObject__());
	},

	/**
	 * plainObjectRecursive descends object values and marks all non-Array
	 * Objects with plainObject.
	 */
	function test_plainObjectRecursiveDescendsObject(self) {
		var one = plainObjectRecursive({"a": {}, "b": {"inside": 1}});
		var two = plainObjectRecursive({"a": {}, "b": {"inside": 2}});
		self.assertFalse(cw.eq.equals(one, two));
		two["b"]["inside"] = 1;
		self.assertTrue(cw.eq.equals(one, two));
	},

	/**
	 * plainObjectRecursive descends array values and marks all non-Array
	 * Objects with plainObject.
	 */
	function test_plainObjectRecursiveDescendsArray(self) {
		var one = plainObjectRecursive([{}, {"inside": 1}, []]);
		var two = plainObjectRecursive([{}, {"inside": 2}, []]);
		self.assertFalse(cw.eq.equals(one, two));
		two[1]["inside"] = 1;
		self.assertTrue(cw.eq.equals(one, two));

		// the Array object was not marked
		self.assertIdentical(undefined, one[2].__isPlainObject__);
		self.assertIdentical(undefined, two[2].__isPlainObject__);
	},

	/**
	 * plainObjectRecursive accepts and passes through non-object/array
	 * values.
	 */
	function test_plainObjectRecursivePassThrough(self) {
		// No Errors are raised for any of these
		self.assertIdentical(3, plainObjectRecursive(3));
		self.assertIdentical(null, plainObjectRecursive(null));
		self.assertIdentical(true, plainObjectRecursive(true));
		self.assertIdentical(undefined, plainObjectRecursive(undefined));
	}
);



cw.UnitTest.TestCase.subclass(cw.Test.TestEq, 'EqualsTests').methods(

	function test_equalsArrayLengthMismatch(self) {
		var one = [plainObject({}), [1], [3]];
		var two = [plainObject({}), [1], [3, 4]];
		var messages = [];
		var equal = cw.eq.equals(one, two, messages);
		self.assertFalse(equal);

		var expectedMessages = [
			'descending into array',
			'descending into object',
			'ascending from object',
			'descending into array',
			'ascending from array',
			'descending into array',
			'array length mismatch: 1, 2',
			'earlier comparisons indicate mismatch at array item #2'
		]

		// Avoid using self.assertEqual in this file, in case cw.eq is broken
		self.assertIdentical(expectedMessages.join('\n'), messages.join('\n'));
	},

	function test_equalsArrayItemMismatch(self) {
		var one = [[1], [3]];
		var two = [[1], [4]];
		var messages = [];
		var equal = cw.eq.equals(one, two, messages);
		self.assertFalse(equal);

		var expectedMessages = [
			'descending into array',
			'descending into array',
			'ascending from array',
			'descending into array',
			'earlier comparisons indicate mismatch at array item #0',
			'earlier comparisons indicate mismatch at array item #1'
		]

		// Avoid using self.assertEqual in this file, in case cw.eq is broken
		self.assertIdentical(expectedMessages.join('\n'), messages.join('\n'));
	},

	function test_equalsObjectValueNotEqual(self) {
		var one = plainObject({'x': 2});
		var two = plainObject({'x': 3});
		var messages = [];
		var equal = cw.eq.equals(one, two, messages);
		self.assertFalse(equal);

		var expectedMessages = [
			'descending into object',
			'earlier comparisons indicate mismatch at property x'
		]

		self.assertIdentical(expectedMessages.join('\n'), messages.join('\n'));
	},

	function test_equalsObjectLeftPropertyMissingOnRight(self) {
		var one = plainObject({'outer': plainObject({'x': 2})});
		var two = plainObject({'outer': plainObject({'y': 2})});
		var messages = [];
		var equal = cw.eq.equals(one, two, messages);
		self.assertFalse(equal);

		var expectedMessages = [
			'descending into object',
			'descending into object',
			'property x missing on right object',
			'earlier comparisons indicate mismatch at property outer'
		]

		self.assertIdentical(expectedMessages.join('\n'), messages.join('\n'));
	},

	function test_equalsObjectRightPropertyMissingOnLeft(self) {
		var one = plainObject({'x': 2});
		var two = plainObject({'x': 2, 'y': 3});
		var messages = [];
		var equal = cw.eq.equals(one, two, messages);
		self.assertFalse(equal);

		var expectedMessages = [
			'descending into object',
			'property y missing on left object'
		]

		self.assertIdentical(expectedMessages.join('\n'), messages.join('\n'));
	},

	function test_NaN(self) {
		// Sanity checks
		self.assertFalse(cw.eq.equals(Number.NaN, Number.NaN));
		self.assertFalse(cw.eq.equals([Number.NaN], [Number.NaN]));

		// Now, the interesting part: make sure there's no object-identity
		// shortcut.
		var one = [Number.NaN];
		self.assertFalse(cw.eq.equals(one, one));
		self.assertFalse(cw.eq.equals([one], [one]));
	},

	/**
	 * The `messages` argument is optional.
	 */
	function test_equalsNoMessageLog(self) {
		var one = [[1], [3]];
		var two = [[1], [3, 4]];
		var equal = cw.eq.equals(one, two);
		self.assertFalse(equal);
	},

	function test_wildcard(self) {
		self.assertTrue(cw.eq.equals('hello', cw.eq.Wildcard));
		self.assertTrue(cw.eq.equals(cw.eq.Wildcard, 'hello'));
		self.assertTrue(cw.eq.equals(cw.eq.Wildcard, cw.eq.Wildcard));
	},

	function test_wildcardInObject(self) {
		var one = plainObject({'hello': 1});
		var two = plainObject({'hello': cw.eq.Wildcard});
		self.assertTrue(cw.eq.equals(one, two));
		self.assertTrue(cw.eq.equals(two, one));
	},

	function test_wildcardInArray(self) {
		self.assertTrue(cw.eq.equals([1], [cw.eq.Wildcard]));
		self.assertTrue(cw.eq.equals([cw.eq.Wildcard], [1]));
	},

	/**
	 * The cw.repr.repr(Wildcard) is good.
	 */
	function test_wildcardRepr(self) {
		self.assertIdentical('<cw.eq.Wildcard>', cw.repr.repr(cw.eq.Wildcard));
	}

	// TODO: IE6-IE8 [[DontEnum]] shadowing tests

	// TODO: consider making cw.eq properly compare Arrays with Argument
	// arrays, like our old TestCase.assertEqual.
);

})(); // end anti-clobbering for JScript

/**
 * @fileoverview Tests for cw.eq
 */

goog.provide('cw.Test.TestEq');

goog.require('cw.Class');
goog.require('cw.UnitTest');
goog.require('cw.eq');
goog.require('goog.array');


// anti-clobbering for JScript; aliases
(function(){

var equals = cw.eq.equals;


// Note: cw.eq is also indirectly tested by cw.Test.TestUnitTestAssertions
// TODO: move some of those tests here
// TODO: copy some tests from goog.testing.asserts
// TODO: tests for custom .equals() behavior
// TODO: make sure those custom `equals` methods can push messages

cw.UnitTest.TestCase.subclass(cw.Test.TestEq, 'EqualsTests').methods(

	function test_equalsArrayLengthMismatch(self) {
		var one = [{}, [1], [3]];
		var two = [{}, [1], [3, 4]];
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
		var one = {'x': 2};
		var two = {'x': 3};
		var messages = [];
		var equal = cw.eq.equals(one, two, messages);
		self.assertFalse(equal);

		var expectedMessages = [
			'descending into object',
			'earlier comparisons indicate mismatch at property x'
		]

		// Avoid using self.assertEqual in this file, in case cw.eq is broken
		self.assertIdentical(expectedMessages.join('\n'), messages.join('\n'));
	},

	function test_equalsObjectLeftPropertyMissingOnRight(self) {
		var one = {'outer': {'x': 2}};
		var two = {'outer': {'y': 2}};
		var messages = [];
		var equal = cw.eq.equals(one, two, messages);
		self.assertFalse(equal);

		var expectedMessages = [
			'descending into object',
			'descending into object',
			'property x missing on right object',
			'earlier comparisons indicate mismatch at property outer'
		]

		// Avoid using self.assertEqual in this file, in case cw.eq is broken
		self.assertIdentical(expectedMessages.join('\n'), messages.join('\n'));
	},

	function test_equalsObjectRightPropertyMissingOnLeft(self) {
		var one = {'x': 2}
		var two = {'x': 2, 'y': 3}
		var messages = [];
		var equal = cw.eq.equals(one, two, messages);
		self.assertFalse(equal);

		var expectedMessages = [
			'descending into object',
			'property y missing on left object'
		]

		// Avoid using self.assertEqual in this file, in case cw.eq is broken
		self.assertIdentical(expectedMessages.join('\n'), messages.join('\n'));
	},

	/**
	 * The `messages` argument is optional.
	 */
	function test_equalsNoMessageLog(self) {
		var one = [[1], [3]];
		var two = [[1], [3, 4]];
		var equal = cw.eq.equals(one, two);
		self.assertFalse(equal);
	}

	// TODO: IE6-IE8 [[DontEnum]] shadowing tests
);

})(); // end anti-clobbering for JScript

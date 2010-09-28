/**
 * @fileoverview Tests for cw.repr
 */

goog.provide('cw.Test.TestRepr');

goog.require('cw.Class');
goog.require('cw.UnitTest');
goog.require('cw.repr');
goog.require('goog.array');


// anti-clobbering for JScript; aliases
(function(){

var repr = cw.repr.repr;
var reprToPieces = cw.repr.reprToPieces;

/**
 * Tests for L{cw.repr.repr}.
 */
cw.UnitTest.TestCase.subclass(cw.Test.TestRepr, 'ReprTests').methods(
	function test_basicRepr(self) {
		var object = {'prop1': ['array', 'items', 1, 1.5, null, true, false, {"1": "abc"}, {}, [1, 2], [1], []]};
		self.assertIdentical('{"prop1": ["array", "items", 1, 1.5, null, true, false, {"1": "abc"}, {}, [1, 2], [1], []]}', repr(object));
	},

	/**
	 * Test that repr(undefined) and repr(null) work.
	 */
	function test_undefinedAndNull(self) {
		self.assertIdentical(repr(null), 'null');
		self.assertIdentical(repr(undefined), 'undefined');
	},

	/**
	 * Test that some simple values have a reasonable repr().
	 */
	function test_simpleValues(self) {
		self.assertIdentical(repr(5), '5');
		self.assertIdentical(repr([5]), '[5]');
		self.assertIdentical(repr([5, 6]), '[5, 6]');
		self.assertIdentical(repr([5, null]), '[5, null]');
		self.assertIdentical(repr([5, true]), '[5, true]');
		self.assertIdentical(repr([5, false]), '[5, false]');

		self.assertIdentical(repr(new Object()), '{}');
		self.assertIdentical(repr({}), '{}');
		self.assertIdentical(repr({"a": 3, "b": 4}), '{"a": 3, "b": 4}');
		self.assertIdentical(repr({"a": 3, "b": {}}), '{"a": 3, "b": {}}');
		self.assertIdentical(repr({"a": 3, "b": {a: "c"}}), '{"a": 3, "b": {"a": "c"}}');
		self.assertIdentical(repr({"a": 3, "b": []}), '{"a": 3, "b": []}');
		self.assertIdentical(repr('foo'), '"foo"');
	},

	/**
	 * Test that repr still works if an object has an evil hasOwnProperty.
	 */
	function test_evilHasOwnProperty(self) {
		var o = {'hasOwnProperty': null};
		self.assertIdentical(repr(o), '{"hasOwnProperty": null}');
	},

	/**
	 * Test {@code cw.repr.reprToPieces}
	 */
	function test_reprToPieces(self) {
		var sb = [];
		reprToPieces([5, true], sb);
		self.assertEqual(sb, ['[', '', '5', ', ', 'true', ']']);

		// With existing values already
		var sb = ['x', 'yz'];
		reprToPieces([5, true], sb);
		self.assertEqual(sb, ['x', 'yz', '[', '', '5', ', ', 'true', ']']);
	},

	function test_nestedEscaping(self) {
		// All the escaping still works in nested objects/arrays
		self.assertIdentical(repr(['\u0000', '\u0000']), '["\\u0000", "\\u0000"]');
		self.assertIdentical(repr(['\u0000', '\u0000', {'\u0000': '0'}]), '["\\u0000", "\\u0000", {"\\u0000": "0"}]');
	},

	function test_date(self) {
		var s = repr(new Date(2009, 0, 1));
		self.assertTrue(goog.string.startsWith(s, "new Date(123"), s);
		self.assertTrue(goog.string.endsWith(s, ")"), s);
	},

	function test_RegExp(self) {
		self.assertIdentical(repr(/\t/), '/\\t/');
	},

	function test_customReprWorksForAllNonPrimitives(self) {
		goog.array.forEach([function() {}, {}, [], new Date(2009, 0, 1), /a/], function(obj) {
			obj.__repr__ = function(stack) { return 'custom'; };
			self.assertIdentical(repr(obj), 'custom');
		});
	},

	/**
	 * a __reprToPieces__ is higher-priority than a __repr__
	 */
	function test_customReprToPiecesPriority(self) {
		goog.array.forEach([function() {}, {}, [], new Date(2009, 0, 1), /a/], function(obj) {
			obj.__reprToPieces__ = function(sb, stack) { sb.push('a', 'b'); };
			obj.__repr__ = function(stack) { return 'custom'; };
			self.assertIdentical(repr(obj), 'ab');
		});
	},

	/**
	 * The output from a __repr__ function is used as-is, not escaped further.
	 */
	function test_customReprOutputNotEscaped(self) {
		var a = [];
		a.__repr__ = function(stack) { return '\uffff'; };
		self.assertIdentical(repr(a), "\uffff");
	},

	/**
	 * All object properties are found, even those covered by the [[DontEnum]]
	 * shadowing bug in IE6-IE8.
	 */
	function test_dontEnumShadowingWorkaround(self) {
		var evil = {
			"constructor": 1,
			"hasOwnProperty": 2,
			"isPrototypeOf": 3,
			"propertyIsEnumerable": 4,
			"toLocaleString": 5,
			"toString": 6,
			"valueOf": 7,
			"toJSON": 8}; // IE8+
		var serialized = repr(evil);
		// Make sure we have 8 pieces
		var split = serialized.split(",");
		self.assertIdentical(8, split.length);
	},

	/**
	 * Runaway recursion is avoided and a #CYCLETO:n# marker is used.
	 */
	function test_recursion(self) {
		var a = {};
		var b = {};
		a.to_b = b;
		b.to_a = a;
		self.assertIdentical(repr(a), '{"to_b": {"to_a": #CYCLETO:0#}}');
		self.assertIdentical(repr([a]), '[{"to_b": {"to_a": #CYCLETO:1#}}]');
	},

	/**
	 * Two references to the same object don't result in a #CYCLETO:n# marker.
	 */
	function test_notRecursion(self) {
		var a = {};
		self.assertIdentical(repr([a, a, [a]]), '[{}, {}, [{}]]');
	}
);

})(); // end anti-clobbering for JScript

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

/**
 * Tests for L{cw.repr.repr}.
 */
cw.UnitTest.TestCase.subclass(cw.Test.TestRepr, 'ReprTests').methods(
	function test_basicRepr(self) {
		var object = {'prop1':['array','items',1,1.5,null,true,false,{"1":"abc"},{},[1,2],[1],[]]};
		self.assertIdentical('({"prop1":["array","items",1,1.5,null,true,false,{"1":"abc"},{},[1,2],[1],[]]})', repr(object));
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
		self.assertIdentical(repr([5, 6]), '[5,6]');
		self.assertIdentical(repr([5, null]), '[5,null]');
		self.assertIdentical(repr([5, true]), '[5,true]');
		self.assertIdentical(repr([5, false]), '[5,false]');

		self.assertIdentical(repr(new Object()), '({})');
		self.assertIdentical(repr({}), '({})');
		self.assertIdentical(repr({"a": 3, "b": 4}), '({"a":3,"b":4})');
		self.assertIdentical(repr({"a": 3, "b": {}}), '({"a":3,"b":{}})');
		self.assertIdentical(repr({"a": 3, "b": {a: "c"}}), '({"a":3,"b":{"a":"c"}})');
		self.assertIdentical(repr({"a": 3, "b": []}), '({"a":3,"b":[]})');
		self.assertIdentical(repr('foo'), '"foo"');
	},

	function test_nestedEscaping(self) {
		// All the escaping still works in nested objects/arrays
		self.assertIdentical(repr(['\u0000', '\u0000']), '["\\u0000","\\u0000"]');
		self.assertIdentical(repr(['\u0000', '\u0000', {'\u0000': '0'}]), '["\\u0000","\\u0000",{"\\u0000":"0"}]');
	},

	function test_date(self) {
		self.assert(goog.string.startsWith(repr(new Date(2009, 0, 1)), "(new Date(123"));
	},

	function test_RegExp(self) {
		self.assertIdentical(repr(/\t/), '/\\t/');
	},

	function test_customReprWorksForAllNonPrimitives(self) {
		goog.array.forEach([function() {}, {}, [], new Date(2009, 0, 1), /a/], function(obj) {
			obj.__repr__ = function() { return 'custom'; };
			self.assertIdentical(repr(obj), 'custom');
		});
	},

	/**
	 * If a custom __repr__ function for the outer object outputs a left "{",
	 * the entire output is wrapped in parentheses.
	 */
	function test_customReprMakesCurlies(self) {
		var a = [];
		a.__repr__ = function() { return '{more'; };
		self.assertIdentical(repr(a), "({more)");
	}

	// TODO: test that toString and other [[DontEnum]] properties are found
	// in IE6-8 (right now they are not).
);

})(); // end anti-clobbering for JScript

/**
 * @fileoverview Tests for cw.repr
 */

goog.provide('cw.Test.TestRepr');

goog.require('cw.Class');
goog.require('cw.UnitTest');
goog.require('cw.repr');


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

	function test_miscTypes(self) {
		self.assert(goog.string.startsWith(repr(new Date(2009, 0, 1)), "(new Date(123"));
		self.assertIdentical(repr(/\t/), '/\\t/');
	}

	// TODO: test that toString/other builtin properties are found in JScript; need a list of them
);

})(); // end anti-clobbering for JScript

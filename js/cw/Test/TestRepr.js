/**
 * @fileoverview Tests for cw.repr
 */

goog.provide('cw.Test.TestRepr');

goog.require('cw.Class');
goog.require('cw.UnitTest');
goog.require('cw.repr');


// anti-clobbering for JScript
(function(){


/**
 * Tests for L{cw.repr.repr}.
 */
cw.UnitTest.TestCase.subclass(cw.Test.TestRepr, 'ReprTests').methods(
	/**
	 * Test that repr(undefined) and repr(null) work.
	 */
	function test_undefinedAndNull(self) {
		var repr = cw.repr.repr;
		self.assertIdentical(repr(null), 'null');
		self.assertIdentical(repr(undefined), 'undefined');
	},

	/**
	 * Test that some simple values have a reasonable repr().
	 */
	function test_simpleValues(self) {
		var repr = cw.repr.repr;
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

	function test_shortEscapes(self) {
		var repr = cw.repr.repr;
		self.assertIdentical(repr('fo\to'), '"fo\\to"');
		self.assertIdentical(repr('fo\no'), '"fo\\no"');
		self.assertIdentical(repr('fo\fo'), '"fo\\fo"');
		self.assertIdentical(repr('fo\ro'), '"fo\\ro"');

		self.assertIdentical(repr('fo"o'), '"fo\\"o"');
		self.assertIdentical(repr('fo\'o'), '"fo\'o"'); // no escape of single quote
		self.assertIdentical(repr('fo\\o'), '"fo\\\\o"');

	},

	function test_UEscapes(self) {
		var repr = cw.repr.repr;
		self.assertIdentical(repr('\u0000'), '"\\u0000"');
		self.assertIdentical(repr('\u000B'), '"\\u000b"'); // vertical tab; aka \v in decent browsers
		self.assertIdentical(repr('\u0010'), '"\\u0010"');
		self.assertIdentical(repr('\u0015'), '"\\u0015"');
		self.assertIdentical(repr('\u0019'), '"\\u0019"');
		self.assertIdentical(repr('\u0020'), '" "');
		self.assertIdentical(repr('\u007E'), '"~"');
		self.assertIdentical(repr('\u007F'), '"\\u007f"');
		self.assertIdentical(repr('\u0099'), '"\\u0099"');
		self.assertIdentical(repr('\u0100'), '"\\u0100"');
		self.assertIdentical(repr('\u0400'), '"\\u0400"');
		self.assertIdentical(repr('\u0999'), '"\\u0999"');
		self.assertIdentical(repr('\u1000'), '"\\u1000"');
		self.assertIdentical(repr('\ubeef'), '"\\ubeef"');
		self.assertIdentical(repr('\uFFFF'), '"\\uffff"');
	},

	function test_nestedEscaping(self) {
		var repr = cw.repr.repr;
		// All the escaping still works in nested objects/arrays
		self.assertIdentical(repr(['\u0000', '\u0000']), '["\\u0000","\\u0000"]');
		self.assertIdentical(repr(['\u0000', '\u0000', {'\u0000': '0'}]), '["\\u0000","\\u0000",{"\\u0000":"0"}]');
	},

	function test_miscTypes(self) {
		var repr = cw.repr.repr;
		self.assert(goog.string.startsWith(repr(new Date(2009, 0, 1)), "(new Date(123"));
		self.assertIdentical(repr(/\t/), '/\\t/');
	}

	// TODO: test that toString/other builtin properties are found in JScript; need a list of them
);

})(); // end anti-clobbering for JScript

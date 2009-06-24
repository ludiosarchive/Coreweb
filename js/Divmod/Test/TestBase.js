/**
 * Tests for CW.__init__
 *
 * Apparently not related to CW's Base.js.
 */

// import CW.UnitTest

CW.UnitTest.TestCase.subclass(CW.Test.TestBase, 'TestBase').methods(

	// if ever need some kind of "bootstrap" we'll add it back
//	/**
//	 * Verify that the CW module's bootstrap function sets its '_location'
//	 * attribute.
//	 */
//	function test_divmodBootstrap(self) {
//		var notCW = {};
//		notCW.bootstrap = CW.bootstrap;
//		var STUFF = "hello there";
//		notCW.bootstrap(STUFF);
//		self.assertIdentical(notCW._location, STUFF);
//	},

	// We don't care about CW.Base's old JSON code, but test our own.
	
	/**
	 * Assert that JSON encoder is doing at least basic escaping.
	 */
	function test_basicEscaping(self) {

		// NULL is the only character we really care about being encoded,
		// because there may be problems uploading it through XHR or Flash.

		// simplejson on the server will liberally decode just about anything.
		// (control characters like RTL are unlikely to cause problems. TODO: confirm?)

		var s = '\r\n\f\b\t\u0000';
		var repr = CW.JSON.stringify(s);

		var expected = '"\\r\\n\\f\\b\\t\\u0000"';

		// Firefox 3.1 does this, but OK if other browsers do the same thing. (Two answers are valid here.)
		var expectedFF31Plus = "\"\\u000d\\u000a\\u000c\\u0008\\u0009\\u0000\"";
		if(repr.length > expected.length) {
			self.assertIdentical(repr, expectedFF31Plus);
		} else {
			self.assertIdentical(repr, expected);
		}
	},


	/**
	 * Trivial JSON serialization test that doesn't rely on some
	 * arbitrary internal JS object property order.
	 */
	function test_serializeJSON(self) {
		var expr = [{}, {1: "2"}, {"c": [null, NaN, [{x: ["\\", "'", ""]}]]}];
		var json = CW.JSON.stringify(expr);

		// We assume that if the browser has a native JSON encoder,
		// it won't be adding spaces. (FF 3.1 behavior seems to match this)
		var expected = '[{},{"1":"2"},{"c":[null,null,[{"x":["\\\\","\'",""]}]]}]';
		self.assertIdentical(json, expected);
	},


	/**
	 * Check that arrays which contain identical elements are considered
	 * equal.
	 */
	function test_arraysEqualPositive(self) {
		self.assert(CW.arraysEqual([], []));
		self.assert(CW.arraysEqual([1, 2], [1, 2]));
		var x = {a: 1, b: 2};
		self.assert(CW.arraysEqual([x, 3], [x, 3]));
	},


	/**
	 * Check that arrays with contain different elements are not
	 * considered equal.
	 */
	function test_arraysEqualNegative(self) {
		self.assert(!CW.arraysEqual([], [null]));
		self.assert(!CW.arraysEqual([1], [2]));
		self.assert(!CW.arraysEqual({'a': undefined}, {'b': 2}));
		self.assert(!CW.arraysEqual(
						function () { return 1; },
						function () { return 2; }));
	},


	/**
	 * Check that sparse arrays with contain different elements are not
	 * considered equal.
	 */
	function test_arraysSparseEqualNegative(self) {
		self.assert(!CW.arraysEqual([1,"2",undefined,10], [1,"2",undefined,11]));
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
		self.assert(!CW.arraysEqual(a1, a2));
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
		self.assert(!CW.arraysEqual(a, b));
	},


	/**
	 * Check that startswith is working as expected.
	 */
	function test_startswith(self) {
		self.assert(CW.startswith("hello", "h"));
		self.assert(CW.startswith("hello", ""));
		self.assert(CW.startswith("hello", "hell"));
		self.assert(CW.startswith("hello", "hello"));
		self.assert(!CW.startswith("something else", "not related"));
		self.assert(!CW.startswith("not related", "something else"));
		self.assert(!CW.startswith("hello", "hello!"));
		self.assertThrows(Error, function(){self.assert(!CW.startswith(null, "hello"));});
		self.assertThrows(Error, function(){self.assert(!CW.startswith("hello", null));});
		self.assertThrows(Error, function(){self.assert(!CW.startswith(undefined, "hello"));});
		self.assertThrows(Error, function(){self.assert(!CW.startswith("hello", undefined));});
		self.assert(!CW.startswith("3he", 3));
		self.assertThrows(Error, function(){CW.startswith(3, "3");});
		self.assertThrows(Error, function(){CW.startswith(33, "33");});
		self.assertThrows(Error, function(){CW.startswith(33, "3");});
	}
);

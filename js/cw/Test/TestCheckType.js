/**
 * @fileoverview Tests for cw.checktype
 */

goog.provide('cw.Test.TestCheckType');

goog.require('cw.Class');
goog.require('cw.UnitTest');
goog.require('cw.checktype');


// anti-clobbering for JScript
(function(){


/**
 * Tests for {@code cw.checktype.ensureInt}
 */
cw.UnitTest.TestCase.subclass(cw.Test.TestCheckType, 'EnsureIntTests').methods(

	function setUp(self) {
		self.func = cw.checktype.ensureInt;
	},

	function test_ensureInt(self) {
		self.assertIdentical(3, self.func(3));
		self.assertIdentical(-3, self.func(-3));
		self.assertIdentical(0, self.func(0));
		self.assertIdentical(null, self.func(3.5));
		self.assertIdentical(null, self.func(-3.5));
		self.assertIdentical(null, self.func(NaN));
		self.assertIdentical(null, self.func(Infinity));
		self.assertIdentical(null, self.func(-Infinity));
		self.assertIdentical(null, self.func(new Number(4)));
		self.assertIdentical(null, self.func([4]));
		self.assertIdentical(null, self.func({4: 1}));
		self.assertIdentical(null, self.func(true));
		self.assertIdentical(null, self.func(false));
		self.assertIdentical(null, self.func("4"));
	}
);


/**
 * Tests for {@code cw.checktype.ensureIntInRange}
 *
 * ensureIntInRange is more restrictive than ensureInt, so we subclass
 * the ensureInt tests so that we run them as well.
 */
cw.Test.TestCheckType.EnsureIntTests.subclass(cw.Test.TestCheckType, 'EnsureIntInRangeTests').methods(

	function setUp(self) {
		self.func = function(v) {
			return cw.checktype.ensureInt(v, -10000, 10000);
		};
	},

	function test_ensureIntInRange(self) {
		self.assertIdentical(3, cw.checktype.ensureIntInRange(3, 3, 3));
		self.assertIdentical(3, cw.checktype.ensureIntInRange(3, -3, 3));
		self.assertIdentical(-3, cw.checktype.ensureIntInRange(-3, -3, 3));
		self.assertIdentical(null, cw.checktype.ensureIntInRange(-4, -3, 3));
		self.assertIdentical(null, cw.checktype.ensureIntInRange(4, -3, 3));
	}
);


/**
 * Tests for {@code cw.checktype.ensureBool}
 */
cw.UnitTest.TestCase.subclass(cw.Test.TestCheckType, 'EnsureBool').methods(

	function test_ensureBool(self) {
		self.assertIdentical(true, cw.checktype.ensureBool(true));
		self.assertIdentical(true, cw.checktype.ensureBool(1));
		self.assertIdentical(true, cw.checktype.ensureBool(1.0));

		self.assertIdentical(false, cw.checktype.ensureBool(false));
		self.assertIdentical(false, cw.checktype.ensureBool(0));
		self.assertIdentical(false, cw.checktype.ensureBool(0.0));
		self.assertIdentical(false, cw.checktype.ensureBool(-0));
		self.assertIdentical(false, cw.checktype.ensureBool(-0.0));
		
		self.assertIdentical(null, cw.checktype.ensureBool(1.0001));
		self.assertIdentical(null, cw.checktype.ensureBool(0.0001));
		self.assertIdentical(null, cw.checktype.ensureBool("0"));
		self.assertIdentical(null, cw.checktype.ensureBool("1"));
		self.assertIdentical(null, cw.checktype.ensureBool("true"));
		self.assertIdentical(null, cw.checktype.ensureBool("false"));
		self.assertIdentical(null, cw.checktype.ensureBool(NaN));
	}
);


})(); // end anti-clobbering for JScript

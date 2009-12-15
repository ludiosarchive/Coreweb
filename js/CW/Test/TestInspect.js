/**
 * Tests for CW.Inspect
 */

// import CW.UnitTest
// import CW.Inspect


CW.UnitTest.TestCase.subclass(CW.Test.TestInspect, 'TestInspect').methods(
	/**
	 * Test that L{CW.Inspect.methods} returns all the methods of a class
	 * object.
	 */
	function test_methods(self) {

		/* CW.Class has no visible toString method for some reason.  If this
		 * ever changes, feel free to change this test.
		 */
		self.assertArraysEqual(CW.Inspect.methods(CW.Class),
							   ["__init__"]);

		var TestClass = CW.Class.subclass("test_inspect.test_methods.TestClass");
		TestClass.methods(function method() {});

		/* Subclasses get two methods automagically, __init__ and toString.  If
		 * this ever changes, feel free to change this test.
		 */

		// as for IE, there may be related info about this bug at:
		// http://www.nabble.com/IE-and-the-%27toString%27-property---inheritance-issues-td10761491.html

		var isIE='\v'=='v';

		if(!isIE) {
			self.assertArraysEqual(CW.Inspect.methods(TestClass),
							   ["__init__", "method", "toString"]);
		} else {
			self.assertArraysEqual(CW.Inspect.methods(TestClass),
							   ["__init__", "method"]);
		}

		var TestSubclass = TestClass.subclass("test_inspect.test_methods.TestSubclass");
		TestSubclass.methods(function anotherMethod() {});

		if(!isIE) {
			self.assertArraysEqual(CW.Inspect.methods(TestSubclass),
								   ["__init__", "anotherMethod", "method", "toString"]);
		} else {
			self.assertArraysEqual(CW.Inspect.methods(TestSubclass),
								   ["__init__", "anotherMethod", "method"]);
		}
	},


	/**
	 * Test that an appropriate exception is raised if the methods of an instance
	 * are requested.
	 */
	function test_methodsAgainstInstance(self) {
		var msg = "Only classes have methods.";
		var error;

		error = self.assertThrows(
			Error,
			function() {
				return CW.Inspect.methods([]);
			});
		self.assertErrorMessage(error, msg);

		error = self.assertThrows(
			Error,
			function() {
				return CW.Inspect.methods({});
			});
		//alert(error.message.replace('Stacktrace', 'Funtime'));
		self.assertErrorMessage(error, msg);

		error = self.assertThrows(
			Error,
			function() {
				return CW.Inspect.methods(0);
			});
		self.assertErrorMessage(error, msg);

		error = self.assertThrows(
			Error,
			function() {
				return CW.Inspect.methods("");
			});
		self.assertErrorMessage(error, msg);

		error = self.assertThrows(
			Error,
			function() {
				return CW.Inspect.methods(CW.Class());
			});
		self.assertErrorMessage(error, msg);
	}
);

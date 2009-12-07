// import CW.UnitTest
goog.require('cw.externalinterface');


/**
 * Test assumptions about JavaScript in each browser.
 */
CW.UnitTest.TestCase.subclass(CW.Test.TestExternalInterface, 'TestSerializer').methods(

	function test_request(self) {
		self.assertIdentical(
			'<invoke name="func1" returntype="javascript"><arguments></arguments></invoke>',
			cw.externalinterface.request('func1'));

		self.assertIdentical(
			'<invoke name="func1" returntype="javascript"><arguments><string>hello</string><number>3</number></arguments></invoke>',
			cw.externalinterface.request('func1', 'hello', 3));
	}

);

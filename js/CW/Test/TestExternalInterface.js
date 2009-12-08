// import CW.UnitTest
goog.require('cw.externalinterface');


// TODO: test objects (array, object, Date) created in another window (use an iframe)

// TODO: test big and small numbers JS->Flash->JS. The 'E' notation might ruin things.


CW.UnitTest.TestCase.subclass(CW.Test.TestExternalInterface, 'TestSerializer').methods(


	function _func1(self, str) {
		return '<invoke name="func1" returntype="javascript"><arguments>'+str+'</arguments></invoke>';
	},


	function test_noArguments(self) {
		self.assertIdentical(
			self._func1(''),
			cw.externalinterface.request('func1'));
	},


	function test_twoArguments(self) {
		self.assertIdentical(
			self._func1('<string>hello</string><number>3</number>'),
			cw.externalinterface.request('func1', 'hello', 3));
	},


	function test_string(self) {
		self.assertIdentical(
			self._func1('<string>hello&amp;lt;&amp;quot;&lt;&gt;&quot;&apos;there</string>'),
			cw.externalinterface.request('func1', 'hello&lt;&quot;<>"\'there'));
	},


	function test_boolean(self) {
		self.assertIdentical(
			self._func1('<true/><false/><true/>'),
			cw.externalinterface.request('func1', true, false, true));
	},


	function test_number(self) {
		self.assertIdentical(
			self._func1('<number>1e-100</number><number>0</number><number>1e+100</number>'),
			cw.externalinterface.request('func1', 1E-100, 0, 1E+100));
	},


	function test_nullAndUndefined(self) {
		self.assertIdentical(
			self._func1('<undefined/><null/><undefined/>'),
			cw.externalinterface.request('func1', undefined, null, undefined));
	},


	function test_date(self) {
		self.assertIdentical(
			self._func1('<date>1</date>'),
			cw.externalinterface.request('func1', new Date(1)));

		self.assertIdentical(
			self._func1('<date>1000000001</date>'),
			cw.externalinterface.request('func1', new Date(1000000001)));
	},
	

	function test_array(self) {
		self.assertIdentical(
			self._func1('<array><property id="0"><true/></property><property id="1"><false/></property></array>'),
			cw.externalinterface.request('func1', [true, false]));
	}

);

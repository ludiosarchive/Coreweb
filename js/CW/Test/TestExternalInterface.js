// import CW.UnitTest
goog.require('goog.dom');
goog.require('goog.async.Deferred');
goog.require('cw.externalinterface');
goog.require('swfobject');


// TODO: test XML encoding for objects (array, object, Date) created in another window (use an iframe)

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


	function test_functionsEncodedToNull(self) {
		self.assertIdentical(
			self._func1('<null/>'),
			cw.externalinterface.request('func1', function(){}));

		function named_function() {};
		self.assertIdentical(
			self._func1('<null/>'),
			cw.externalinterface.request('func1', named_function));
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
	},


	function test_object(self) {
		self.assertIdentical(
			self._func1('<object><property id="hello"><true/></property><property id="there"><false/></property></object>'),
			cw.externalinterface.request('func1', {hello:true, there:false}));
	},


	function test_objectWithEmptyStringKey(self) {
		self.assertIdentical(
			self._func1('<object><property id=""><string>empty</string></property></object>'),
			cw.externalinterface.request('func1', {"": "empty"}));
	},

	/**
	 * Object keys are escaped just like value strings.
	 */
	function test_objectKeysAreEscaped(self) {
		self.assertIdentical(
			self._func1('<object><property id="&lt;&gt;&amp;&quot;&apos;"><true/></property><property id="there"><string>&gt;</string></property></object>'),
			cw.externalinterface.request('func1', {"<>&\"'": true, there: ">"}));
	}

);


CW.UnitTest.TestCase.subclass(CW.Test.TestExternalInterface, 'TestRealFlash').methods(

	function setUp(self) {
		if(!swfobject.ua.pv) {
			throw new CW.UnitTest.SkipTest("This test needs Flash player plugin");
		}
		var div = goog.dom.createDom('div', {"id": "TestExternalInterface"});
		goog.dom.appendChild(document.body, div);

		var flashLoaded = new goog.async.Deferred();
		var timeout = null;
		window.__CW_TestRealFlash_ready = function() {
			self._object = goog.dom.getElement("TestExternalInterface");
			window.__CW_TestRealFlash_ready = undefined; // Not `delete' because IE can't
			if(timeout !== null) {
				goog.global.clearTimeout(timeout);
			}
			flashLoaded.callback(null);
		}
		timeout = goog.global.setTimeout(function() {
			flashLoaded.errback(new Error("hit timeout"));
		}, 8000);

		var flashvars = {
			'onloadcallback': '__CW_TestRealFlash_ready',
			'responsecallback': '__CW_TestRealFlash_response'};
		var params = {};
		swfobject.embedSWF(
			"/@testres_Coreweb/TestExternalInterface.swf", "TestExternalInterface", "30", "30", "9.0.0",
			"/@testres_Coreweb/expressInstall.swf", /*flashvars=*/flashvars, params); // no attributes

		return flashLoaded;
	},


	function tearDown(self) {
		goog.global.__CW_TestRealFlash_response = undefined; // Not `delete' because IE can't
	},


	function test_mirror(self) {
		var d = new goog.async.Deferred();
		var original = [true, false];
		d.addCallback(function(data){
			self.assertEqual(original, data);
		});
		window.__CW_TestRealFlash_response = function(data) {
			d.callback(data);
		}
		self._object.CallFunction(cw.externalinterface.request('respond_correct', [true, false]));
		return d;
	}
);

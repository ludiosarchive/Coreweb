/**
 * @fileoverview Tests for cw.externalinterface
 */

goog.provide('cw.Test.TestExternalInterface');

goog.require('cw.UnitTest');
goog.require('goog.dom');
goog.require('goog.async.Deferred');
goog.require('goog.userAgent');
goog.require('goog.userAgent.flash');
goog.require('goog.ui.media.FlashObject');
goog.require('cw.eq');
goog.require('cw.repr');
goog.require('cw.externalinterface');


// anti-clobbering for JScript; aliases
(function(){

var plainObject = cw.eq.plainObject;
var plainObjectRecursive = cw.eq.plainObjectRecursive;

// TODO: test object with keys that are inherited from Object.prototype
// TODO: same as above, except hasOwnProperty on the object has been deleted


/**
 * Don't actually rely on high fidelity transfer of objects between JS and Flash
 * if you can avoid it. Do ASCII-safe JSON encoding in JavaScript and give
 * Flash the flattest types you can (preferably just call a function with a few
 * arguments).
 *
 * These tests are really pushing the limits of JS<->Flash interaction. 
 */


cw.UnitTest.TestCase.subclass(cw.Test.TestExternalInterface, 'TestSerializer').methods(

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
			self._func1("<string>hello&amp;lt;&amp;quot;&lt;&gt;&quot;'there</string>"),
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


	function test_functionsInArrayEncodedToNull(self) {
		self.assertIdentical(
			self._func1('<array><property id="0"><null/></property></array>'),
			cw.externalinterface.request('func1', [function(){}]));
	},


	function test_functionsInObjectSkipped(self) {
		self.assertIdentical(
			self._func1('<object></object>'),
			cw.externalinterface.request('func1', {"afunc": function(){}}));
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
			self._func1('<object><property id="&lt;&gt;&amp;&quot;\'"><true/></property><property id="there"><string>&gt;</string></property></object>'),
			cw.externalinterface.request('func1', {"<>&\"'": true, there: ">"}));
	},

	/**
	 * Objects from other frames are not instanceof Date, Array, and so on. But the XML
	 * serialization must still work correctly.
	 */
	function test_objectsFromIframe(self) {
		var iframeNode = null;
		var d = new goog.async.Deferred();
		goog.global.__CW_test_objectsFromIframe = function() {
			d.callback(null);
		}

		var _iframe = goog.dom.createDom('iframe',
			{"id": "test_objectsFromIframe", "src": "/@testres_Coreweb/otherframe.html?onloadcallback=__CW_test_objectsFromIframe",
			"width": "1", "height": "1"});
		goog.dom.appendChild(document.body, _iframe);

		d.addCallback(function() {
			try {
				iframeNode = goog.dom.getElement("test_objectsFromIframe");
				var iframe = goog.dom.getFrameContentWindow(iframeNode);

				self.assertIdentical(
					self._func1('<object><property id="k"><string>value</string></property></object>'),
					cw.externalinterface.request('func1', iframe.anObject));

				self.assertIdentical(
					self._func1('<object></object>'),
					cw.externalinterface.request('func1', iframe.anEmptyObject));

				self.assertIdentical(
					self._func1('<array><property id="0"><number>10</number></property></array>'),
					cw.externalinterface.request('func1', iframe.anArray));

				self.assertIdentical(
					self._func1('<array></array>'),
					cw.externalinterface.request('func1', iframe.anEmptyArray));

				self.assertIdentical(
					self._func1('<date>1000000000</date>'),
					cw.externalinterface.request('func1', iframe.aDate));
			} finally {
				goog.global.__CW_test_objectsFromIframe = undefined; // Not `delete' because IE can't
				if(iframeNode) {
					goog.dom.removeNode(iframeNode);
				}
			}
		});

		return d;
	}

);


cw.UnitTest.TestCase.subclass(cw.Test.TestExternalInterface, 'TestRealFlash').methods(

	function setUp(self) {
		if(goog.userAgent.GECKO && !goog.userAgent.isVersion('1.8.1.20')) {
			// Firefox 2.0.0.0 + Flash has a serious issue where, sometime
			// in TestRealFlash (perhaps when the .swf is loaded or when
			// ExternalInterface calls are made?), Firefox's error hierarchy
			// is corrupted.

			// For example, before the corruption, this will alert true, and
			// after the corruption, it will alert false:
			// javascript:try{null.hi}catch(e){alert(e instanceof Error)}

			// The problem also affects our own Error classes like cw.UnitTest.SkipTest.

			// Instead of worrying about 3.5 year old browsers, we just don't
			// intend to use Flash on them. One untested alternative would
			// be to mitigate this by loading Flash in an iframe.

			// Note: Firefox 2.0.0.20 + Flash 10.0 r32 is known good.
			// Skip tests if Firefox version is < 2.0.0.20, because we can't
			// be bothered to test the ancient versions anyway.
			throw new cw.UnitTest.SkipTest(
				"Flash corrupts Error hierarchy in Firefox 2.0.0.0; " +
				"tests disabled for < 2.0.0.20");
		}

		if(!goog.userAgent.flash.isVersion('9')) {
			throw new cw.UnitTest.SkipTest("This test needs Flash player plugin, version 9+");
		}

		// The .swf applet persists between tests.
		var existingFlashDiv = goog.dom.getElement("TestExternalInterface");
		if(existingFlashDiv) {
			// TODO: grab the object by id instead of relying on the DOM
			// to be consistent.
			self._object = existingFlashDiv.firstChild.firstChild;
			return goog.async.Deferred.succeed(null);
		}

		var div = goog.dom.createDom('div', {"id": "TestExternalInterface"});
		goog.dom.appendChild(document.body, div);

		var flashLoaded = new goog.async.Deferred();
		var timeout = null;
		goog.global['__CW_TestRealFlash_ready'] = function() {
			// setTimeout to get out from under the Flash->JS stack frame.
			goog.global['window'].setTimeout(function() {
				self._object = goog.dom.getElement(self._objectId);
				cw.UnitTest.logger.info(
					"TestExternalInterface: _objectId: " + cw.repr.repr([self._objectId]) +
					", _object:" + self._object);
				goog.global['__CW_TestRealFlash_ready'] = undefined; // Not `delete' because IE can't
				if(timeout !== null) {
					goog.global['window'].clearTimeout(timeout);
				}
				flashLoaded.callback(null);
			}, 0);
		}
		timeout = goog.global['window'].setTimeout(function() {
			flashLoaded.errback(new Error("hit timeout"));
		}, 8000);

		var flashObject = new goog.ui.media.FlashObject(
			"/@testres_Coreweb/TestExternalInterface.swf");
		flashObject.setBackgroundColor("#ffffff");
		flashObject.setSize(30, 30);
		flashObject.setFlashVar('onloadcallback', '__CW_TestRealFlash_ready');
		flashObject.setFlashVar('responsecallback', '__CW_TestRealFlash_response');
		self._objectId = flashObject.getId();
		flashObject.render(div);

		return flashLoaded;
	},


	function tearDown(self) {
		goog.global['__CW_TestRealFlash_response'] = undefined; // Not `delete' because IE can't
	},


	function _testRespondCorrectFor(self, original) {
		var d = new goog.async.Deferred();
		d.addCallback(function(data) {
			plainObjectRecursive(data);
			self.assertEqual(original, data);
		});
		goog.global['__CW_TestRealFlash_response'] = function(data) {
			// setTimeout to get out from under the Flash->JS stack frame.
			goog.global['window'].setTimeout(function() {
				d.callback(data);
			}, 0);
		}
		var request = cw.externalinterface.request('respond_correct', original);
		cw.UnitTest.logger.info('_object.CallFunction(' + cw.repr.repr(request) + ')');
		self._object.CallFunction(request);
		return d;
	},

	/**
	 * Test that JSON-encodable types and some scary-looking strings
	 * make it through JS->Flash->JS unaltered.
	 */
	function test_mirror(self) {
		var scaryString = "<>\"'&&amp;";
		var escapedScary = "&lt;&gt;&quot;&apos;&amp;&amp;amp;";
		var original = [
			[],
			plainObject({scaryString: scaryString, escapedScary: escapedScary}),
			"",
			escapedScary,
			scaryString,
			"\\&amp;\"\"\\\"\\\\\\\"\\&amp;\\<\\>\\'&&",
			"\t\n\r\f\b\x0B\u0001",
			0,
			-0.5,
			0.5,
			null,
			true,
			false
		];

		// U+0000 isn't checked because it cannot be sent JS->Flash without post-processing
		// on the Flash side; hopefully this limitation is acceptable.
		// `Date' objects aren't checked because Flash->JS JSON doesn't do it.
		// `undefined' isn't checked either for the same reason.

		return self._testRespondCorrectFor(original);
	},

	/**
	 * Test that a range of integral numbers from -2^53 to 2^53
	 * make it through JS->Flash->JS unaltered.
	 *
	 * Note: fails in Opera 10.60 build 3409, because it has a problem with
	 * -Math.pow(2, 31). The value is represented as -0. Reported to Opera
	 * as DSK-301659.
	 */
	function test_mirrorExtremeNumbers(self) {
		var numbers = [];
		for(var i=0; i <= 53; i++) {
			numbers.push(-Math.pow(2, i));
			numbers.push(Math.pow(2, i));
		}
		var original = plainObject({
			//numbers: [1E-100, 9E-99, 9E99, 1E100] // surprise, these aren't exactly identical when they come back
			numbers: numbers
		});

		return self._testRespondCorrectFor(original);
	},

	/**
	 * Test that a big range of unicode codepoints makes it through JS->Flash->JS unaltered.
	 */
	function test_mirrorUnicodeRange(self) {
		var nums = [];
		for(var i=1; i < 55295 + 1; i++) { // after 55295 we hit the surrogate range. This isn't a maximally-thorough test.
			nums.push(i);
		}
		var string = String.fromCharCode.apply(null, nums);
		self.assertEqual(55295, string.length); // should really be self.ensure

		return self._testRespondCorrectFor(string);
	},

	/**
	 * Test that nested arrays make it through JS->Flash->JS unaltered.
	 */
	function test_mirrorNestedArrays(self) {
		var a = [];
		for(var i=0; i < 33; i++) {
			a = [a];
		}
		return self._testRespondCorrectFor(a);
	},

	/**
	 * Test that nested objects make it through JS->Flash->JS unaltered.
	 *
	 * There is some really terrible O(N^3) or worse stuff going on in Flash
	 * with nested objects. Try i < 20 to completely lock it up. TODO:
	 * further investigation is needed.
	 */
	function test_mirrorNestedObjects(self) {
		var o = plainObject({"n": 1});
		for(var i=0; i < 8; i++) {
			o = plainObject({"n": o});
		}
		return self._testRespondCorrectFor(o);
	}

);

})(); // end anti-clobbering for JScript

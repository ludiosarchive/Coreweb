
// goog.require('goog.string');
//
///**
// * Test:
// *    NULL loss behavior in different browsers,
// *    every byte (except possibly NULL) does download cleanly,
// *    Firefox 2's ridiculous encoding-during-interactive problem,
// *    status code accessibility,
// *    and that we get enough discrete 'readyState 3' events in browsers that do XHR streaming.
// */
//
//cw.UnitTest.TestCase.subclass(CW.Test.TestAssumptions, 'XHR').methods(
//
//	function setUp(self) {
//		self.baseURL = '/test/utf8stream/?';
//		self.paddingLength = 8192;
//		self.howManyMsgs = 6;
//		self.msgLen = 16;
//		self.msgLenOctets = 19;
//		self.nullAtEndMsg = true;
//	},
//
//	/**
//	 * Only needed for annoying FF2-specific test.
//	 *
//	 * From http://www.webtoolkit.info/javascript-utf8.html
//	 */
//	function _utf8Decode(self, utftext) {
//		var string = "";
//		var i = 0;
//		var c = c1 = c2 = 0;
//
//		while ( i < utftext.length ) {
//
//			c = utftext.charCodeAt(i);
//
//			if (c < 128) {
//				string += String.fromCharCode(c);
//				i++;
//			}
//			else if((c > 191) && (c < 224)) {
//				c2 = utftext.charCodeAt(i+1);
//				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
//				i += 2;
//			}
//			else {
//				c2 = utftext.charCodeAt(i+1);
//				var c3 = utftext.charCodeAt(i+2);
//				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
//				i += 3;
//			}
//
//		}
//
//		return string;
//
//	},
//
//
//	/**
//	 * Test our assumptions about how xmlhttprequest works across browsers.
//	 */
//
//	function test_XHR(self) {
//		var ua = navigator.userAgent;
//
//		self.strangeOctetBehaviorDuringInteractive = (ua.indexOf(" Firefox/2.") != -1);
//
//		// this might need to be much better in actual Neptune code.
//
//		// picks up FF1/2/3, Safari 3/4, Chrome
//		self.browserProperlySupportsXHRStream = (ua.indexOf("Gecko") != -1) && (!window.opera);
//
//
//		/**
//		 * Firefox 2 (2.0.0.20 Win tested) specific behavior:
//		 *
//		 * xhr.responseText will represent octets during readyState 3.
//		 * The decoded message (whatever encoding) will only be accessible in readyState 4.
//		 *
//		 * The hilarious effects of this:
//		 *    responseText.length possibly decreasing when it switches to readyState 4.
//		 */
//
//		var allResponseTexts = [];
//
//		var d = new goog.async.Deferred();
//
//		var stateCounters = {};
//
//		var xhr;
//
//		try { xhr = new ActiveXObject("Msxml2.XMLHTTP"); } catch(e1) {
//			try { xhr = new ActiveXObject("Microsoft.XMLHTTP"); } catch(e2) {
//				xhr = new XMLHttpRequest();
//			}
//		}
//
//		var errBacked = false;
//
//		var bAsync = true;
//		// BUGFIX: IE - memory leak on page unload (inter-page leak)
//		if ('\v' == 'v' && bAsync) {
//			fOnUnload = function() {
//				if (xhr.readyState != 4) {
//					xhr.onreadystatechange = new Function;
//					// Safe to abort here since onreadystatechange handler removed
//					xhr.abort();
//				}
//			};
//			attachEvent("onunload", fOnUnload);
//		}
//
//		xhr.open('POST', self.baseURL + goog.string.getRandomString(), true);
//		xhr.onreadystatechange = function(ev) {
//			var state = 0.0 + xhr.readyState;
//
//			if ('\v' == 'v' && bAsync && state == 4) {
//				// without this, IE *will* leak like crazy,
//				//    and Drip will *not* be able to figure out what the problem is.
//				// (Idea from Sergey Ilinsky's XMLHttpRequest.js)
//				xhr.onreadystatechange = new Function;
//				detachEvent("onunload", fOnUnload);
//			}
//
//			if (stateCounters[state] === undefined) {
//				stateCounters[state] = 1;
//			} else {
//				stateCounters[state] += 1;
//			}
//
//			try {
//				/* Check that status always available at state >= 3 in most browsers,
//				 * and at state 4 for IE.  */
//				if('\v' == 'v') {
//					// We tried to catch error for checking .status when state was still 3,
//					// but IE was making it hard/impossible. So the only thing we can do is
//					// check that at least .status is available at state 4.
//					if(state >= 4) {
//						self.assertIdentical(200, xhr.status);
//					}
//				} else {
//					if(state >= 3) {
//						self.assertIdentical(200, xhr.status);
//					}
//				}
//
//				if(self.browserProperlySupportsXHRStream && state == 3) {
//					allResponseTexts.push(xhr.responseText);
//				}
//
//				if(state == 4) {
//					self.finalXHRObservations(xhr, allResponseTexts);
//
//					if('\v' == 'v') {
//						// IE
//						self.assertIdentical(4, CW.dir(stateCounters).length);
//						self.assertIdentical(1, stateCounters["1"]);
//						self.assertIdentical(1, stateCounters["2"]);
//						self.assertIdentical(1, stateCounters["3"]);
//						self.assertIdentical(1, stateCounters["4"]);
//					} else if(window.opera) {
//						// Opera (it never fires for state 1)
//						self.assertIdentical(3, CW.dir(stateCounters).length);
//						self.assertIdentical(1, stateCounters["2"]);
//						self.assertIdentical(1, stateCounters["3"]);
//						self.assertIdentical(1, stateCounters["4"]);
//					} else {
//						// we send 1+C{self.howManyMsgs} discrete events,
//						// but they're not all counted, especially when the network is slow.
//						// Do check that we got more than one, though.
//						self.assert(stateCounters["3"] > 1, "only got one discrete event");
//						self.assertIdentical(1, stateCounters["2"]);
//						self.assertIdentical(1, stateCounters["4"]);
//						if(/WebKit/.test(ua)) {
//							self.assertIdentical(undefined, stateCounters["1"]);
//						} else {
//							// firefox et al
//							self.assertIdentical(1, stateCounters["1"]);
//						}
//					}
//
//					//CW.msg(CW.JSON.stringify(stateCounters));
//				}
//
//			} catch (error) {
//				errBacked = true;
//				d.errback(error);
//			}
//
//			if(state == 4) {
//				if(!errBacked) {
//					d.callback(null);
//				}
//			}
//		}
//		xhr.send('');
//
//		return d;
//	},
//
//
//
//	/**
//	 * Observed NULL behavior:
//	 * IE6/7/8 cut off responseText at the first NULL.
//	 * Opera 9 doesn't cut off, but ignores the NULLs anywhere.
//	 * Firefox 2/3 handle fine. Safari handles fine. Chrome handles fine.
//	 */
//	function _getExpectedLoss(self) {
//		var expectedLoss;
//
//		if(self.nullAtEndMsg !== true) {
//			return 0;
//		}
//
//		if('\v' == 'v') {
//			expectedLoss = ((self.msgLen)*self.howManyMsgs) - ((self.msgLen-1)*1);
//		} else if (window.opera) {
//			expectedLoss = (self.howManyMsgs); // just the NULLs inside the messages.
//		} else {
//			expectedLoss = 0;
//		}
//
//		return expectedLoss;
//	},
//
//	function finalXHRObservations(self, xhr, allResponseTexts) {
//		var finalResponseText = xhr.responseText;
//
//		CW.msg(CW.JSON.stringify(finalResponseText));
//
//		var expectedLoss = self._getExpectedLoss();
//
//		// all browsers should get the right length response
//		self.assertIdentical((self.paddingLength+(self.msgLen*self.howManyMsgs)-expectedLoss), finalResponseText.length);
//
//		if(self.browserProperlySupportsXHRStream) {
//			var lastSeenInReadyState3 = allResponseTexts[allResponseTexts.length-1];
//			if(!self.strangeOctetBehaviorDuringInteractive) {
//				self.assertIdentical(finalResponseText, lastSeenInReadyState3);
//			} else {
//				// final response is utf-8-decoded; lastSeenInReadyState3 is the raw octets.
//				self.assertIdentical((self.paddingLength+(self.msgLen*self.howManyMsgs)-expectedLoss), finalResponseText.length);
//				self.assertIdentical((self.paddingLength+(self.msgLenOctets*self.howManyMsgs)-expectedLoss), lastSeenInReadyState3.length);
//				self.assertIdentical(finalResponseText, self._utf8Decode(lastSeenInReadyState3));
//			}
//		}
//	}
//);
//
//
///**
// * This will fail in Firefox 3, < 3.0.7 because Latin1 bytes will be corrupted during readyState 3.
// * They are uncorrupted by readyState 4.
// *
// * See https://bugzilla.mozilla.org/show_bug.cgi?id=457845
// *
// * The workaround is to never send Latin1 XHR to Firefox 3 < 3.0.7.
// */
//CW.Test.TestAssumptions.XHR.subclass(CW.Test.TestAssumptions, 'XHRLatin1').methods(
//
//	function setUp(self) {
//		self.baseURL = '/test/latin1stream/?';
//		self.paddingLength = 8192;
//		self.howManyMsgs = 6;
//		self.msgLen = 16;
//		self.msgLenOctets = 16;
//		self.nullAtEndMsg = true;
//	},
//
//
//	function finalXHRObservations(self, xhr, allResponseTexts) {
//		var finalResponseText = xhr.responseText;
//
//		var expectedLoss = self._getExpectedLoss();
//
//		self.assertIdentical((self.paddingLength+(self.msgLen*self.howManyMsgs)-expectedLoss), finalResponseText.length);
//
//		if(self.browserProperlySupportsXHRStream) {
//			var lastSeenInReadyState3 = allResponseTexts[allResponseTexts.length-1];
//			self.assertIdentical(finalResponseText, lastSeenInReadyState3);
//
//			// strangeOctetBehaviorDuringInteractive doesn't matter now.
//		}
//	}
//);
//
//
///**
// * See above comment to know why it fails in Firefox 3, < 3.0.7.
// */
//CW.Test.TestAssumptions.XHR.subclass(CW.Test.TestAssumptions, 'RainbowXHRLatin1').methods(
//
//	function setUp(self) {
//		self.baseURL = '/test/rainbow_latin1stream/?';
//		self.paddingLength = 8192;
//		self.howManyMsgs = 6;
//		self.msgLen = 255;
//		self.msgLenOctets = 255;
//		self.nullAtEndMsg = false;
//	},
//
//	function finalXHRObservations(self, xhr, allResponseTexts) {
//		var finalResponseText = xhr.responseText;
//
//		var expectedLoss = self._getExpectedLoss();
//		// We shouldn't be losing anything, because no NULLs in rainbow.
//		// It's kind of weird to test our test helper function here.
//		self.assertIdentical(0, expectedLoss);
//
//		self.assertIdentical((self.paddingLength+(self.msgLen*self.howManyMsgs)-expectedLoss), finalResponseText.length);
//
//		if(self.browserProperlySupportsXHRStream) {
//			var lastSeenInReadyState3 = allResponseTexts[allResponseTexts.length-1];
//			self.assertIdentical(finalResponseText, lastSeenInReadyState3);
//
//			// strangeOctetBehaviorDuringInteractive doesn't matter now.
//		}
//	}
//);

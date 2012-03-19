/**
 * @fileoverview Tests for cw.json
 */

goog.provide('cw.Test.TestJSON');

goog.require('cw.UnitTest');
goog.require('cw.json');


// anti-clobbering for JScript
(function() {

	cw.UnitTest.TestCase.subclass(cw.Test.TestJSON, 'JSONTests').methods(
		/**
		 * cw.json.asciify encodes Unicode characters to ASCII
		 */
		function test_encodesUnicodeToAscii(self) {
			self.assertEqual(
				'{"\\u2603":"\\u2603"}', cw.json.asciify(
				{"\u2603":"\u2603"}));
		}
	);

})(); // end anti-clobbering for JScript

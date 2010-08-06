/**
 * @fileoverview Utilities that help you stop the browser throbber /
 * 	loading spinner.
 */

goog.provide('cw.dethrobber');

goog.require('goog.userAgent');
goog.require('goog.userAgent.product');


/**
 * Return a delay after which we can assume that the spinner has stopped
 * spinning.
 *
 * @return {!Array.<number>} (Delay in milliseconds, times to repeat delay).
 * @private
 * // TODO: types for tuples
 */
cw.dethrobber.getDelayToStopSpinner = function() {
	// In Chrome, a 0ms one time is enough, but in Safari, it is not.
	// See http://ludios.net/browser_bugs/spinner_behavior/xhr_onload_and_0ms.html
	//
	// The numbers below were carefully determined by testing some
	// worst-case scenarios with modal dialogs completely freezing
	// Safari for a while.
	//
	// To get the lowest acceptable numbers here, load /chatapp/ (which
	// has an image that takes 4 seconds to load).  Then, somehow freeze
	// Safari, then unfreeze it.  An easy but untested way would be to use
	// the OS's process management utils (for example, `kill` with the right
	// signal).
	//
	// On OS X, I managed to make this happen by forcing an SSL
	// certificate warning, then clicking to making OS X's modal
	// password prompt dialog appear.  See:
	// Minerva/docs/safari_password_prompt_loading_spinner_stays.png
	//
	// On Windows XP, I managed to make this happen by pressing Ctrl-P
	// to print, which in my specific virtual machine caused Safari to lock
	// up for 20 seconds while it tried to connect to my printer.
	if(!goog.userAgent.WEBKIT) {
		return [0, 0];
	} else if(goog.userAgent.product.CHROME) {
		return [0, 1];
	} else {
		// Assume every WebKit browser but Chrome misbehaves like Safari.
		// Note: this could probably go lower, but I don't want to risk it.
		return [9, 20];
	}
};

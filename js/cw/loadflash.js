/**
 * @fileoverview Functions to load a Flash object that follows our own
 * 	`onloadcallback` protocol.
 */

goog.provide('cw.loadflash');

goog.require('cw.clock');
goog.require('goog.async.Deferred');
goog.require('goog.asserts');
goog.require('goog.debug.Error');
goog.require('goog.dom');
goog.require('goog.string');
goog.require('goog.userAgent');
goog.require('goog.userAgent.flash');
goog.require('goog.ui.media.FlashObject');


/**
 * Loading of the Flash applet has certainly failed because Flash is not
 * available, or because the Flash version is too low, or because the
 * environment makes it impossible to safely load a Flash applet.
 * @param {string=} msg Reason
 * @constructor
 * @extends {goog.debug.Error}
 */
cw.loadflash.FlashLoadFailed = function(msg) {
	goog.debug.Error.call(this, msg);
};
goog.inherits(cw.loadflash.FlashLoadFailed, goog.debug.Error);
cw.loadflash.FlashLoadFailed.prototype.name = 'cw.loadflash.FlashLoadFailed';



/**
 * Our Flash applets call this via ExternalInterface.
 * @type {!Object.<string, function(): undefined>}
 */
goog.global['__loadFlashObject_callbacks'] = {};



/**
 * Take a {@link goog.ui.media.FlashObject} and return a Deferred that
 * fires with the actual Flash element after it has loaded.  This
 * function assumes that the Flash applet takes an `onloadcallback`
 * flashvar and calls that function via ExternalInterface.
 *
 * The returned Deferred can be cancelled.  This is useful for implementing
 * timeouts.  Note that cancelling will not destroy the underlying Flash
 * applet, whether or not it has already been rendered to the page.
 *
 * This can be safely used to load multiple Flash objects at the same time.
 *
 * @param {!cw.clock.IWindowTimeIntervalOptional} clock
 * @param {!goog.ui.media.FlashObject} flashObject
 * @param {string} minVersion Minimum Flash version required.
 * @param {!Element} renderInto The element to render the flashObject into.
 *
 * @return {!goog.async.Deferred} Deferred that fires with the Flash element.
 */
cw.loadflash.loadFlashObject = function(clock, flashObject, minVersion, renderInto) {
	var random;

	var clearCallbackFunction = function() {
		if(random) {
			delete goog.global['__loadFlashObject_callbacks'][random];
			// Note that Flash might still try to call the callback function,
			// if it finishes loading after we cancelled.  This is not a
			// problem because the thrown `blah is undefined` Error
			// is swallowed by Flash (as are all Errors).
		}
	};

	var loadFlashObjectCanceller = clearCallbackFunction;

	if(goog.userAgent.GECKO && !goog.userAgent.isVersion('1.8.1.20')) {
		// Firefox 2.0.0.0 + Flash has a serious issue where, sometime
		// during or after the .swf is loaded, Firefox's error hierarchy
		// is corrupted.  This might even happen only after Flash->JS
		// ExternalInterface calls are made, but this is not confirmed.

		// For example, before the corruption, this will alert true, and
		// after the corruption, it will alert false:
		// javascript:try{null.hi}catch(e){alert(e instanceof Error)}

		// The problem also affects our own Error classes like cw.UnitTest.SkipTest.

		// Instead of worrying about very old Firefox versions, we just don't
		// allow loading Flash applets on them.  One untested alternative
		// would be to mitigate this by loading the applet in an iframe.

		// Note: Firefox 2.0.0.20 + Flash 10.0 r32 is known good.
		// Return if Firefox version is < 2.0.0.20, because we can't
		// be bothered to test all of the ancient Firefox versions.
		return goog.async.Deferred.fail(new cw.loadflash.FlashLoadFailed(
			"Flash corrupts Error hierarchy in Firefox 2.0.0.0; " +
			"disabled for all < 2.0.0.20"));
	}

	if(!goog.userAgent.flash.isVersion(minVersion)) {
		return goog.async.Deferred.fail(new cw.loadflash.FlashLoadFailed(
			"Need Flash Player " + minVersion + "+, had " +
			goog.userAgent.flash.VERSION));
	}
	// In non-IE browsers, flash.isVersion checks navigator.plugins.  Flash's
	// presence in navigator.plugins doesn't guarantee that Flash is actually
	// available.  For example, in Chrome 5.0.375.70 beta, if you disable
	// the Flash Player plugin in about:plugins, Flash Player will still be in
	// navigator.plugins until the user restarts Chrome.  If a .swf is loaded
	// anyway, the applet viewport is replaced with a "Missing Plug-In" text.

	var appletId;
	random = '_' + goog.string.getRandomString();
	goog.asserts.assert(/^([_0-9a-zA-Z]*)$/.test(random),
		"loadFlashObject: random has bad chars");

	var flashLoadedD = new goog.async.Deferred(loadFlashObjectCanceller);

	goog.global['__loadFlashObject_callbacks'][random] = function() {
		// setTimeout to get out from under the Flash->JS stack frame.
		clock.setTimeout(function() {
			clearCallbackFunction();
			var applet = goog.dom.getElement(appletId);
			flashLoadedD.callback(applet);
		}, 0);
	}

	var eiCallString = '__loadFlashObject_callbacks["' + random + '"]()';
	flashObject.setFlashVar('onloadcallback', eiCallString);
	appletId = flashObject.getId();
	flashObject.render(renderInto);

	return flashLoadedD;
};


/**
 * Like {@link cw.loadflash.loadFlashObject}, but with a timeout.
 *
 * Note that a timeout will not destroy the underlying Flash
 * applet, whether or not it has already been rendered to the page.
 *
 * Note that because of clock jumps, in extremely rare cases this will
 * spuriously fire the Deferred with a CancelledError.  If you care, try
 * `loadFlashObject` again if you get a {@link goog.async.Deferred.CancelledError}.
 *
 * @param {!cw.clock.IWindowTimeIntervalOptional} clock
 * @param {!goog.ui.media.FlashObject} flashObject
 * @param {string} minVersion Minimum Flash version required.
 * @param {!Element} renderInto The element to render the flashObject into.
 * @param {number} timeout Timeout in milliseconds.
 *
 * @return {!goog.async.Deferred} Deferred that fires with the Flash element.
 */
cw.loadflash.loadFlashObjectWithTimeout = function(clock, flashObject, minVersion, renderInto, timeout) {
	var flashLoadedD = cw.loadflash.loadFlashObject(clock, flashObject, minVersion, renderInto);

	var ticket = clock.setTimeout(function() {
		flashLoadedD.cancel();
	}, timeout);

	flashLoadedD.addBoth(function(appletOrError) {
		clock.clearTimeout(ticket);
		return appletOrError;
	});

	return flashLoadedD;
};

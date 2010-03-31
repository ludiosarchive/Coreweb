/**
 * Functions to collect various information about the environment.
 */

goog.provide('cw.env');

goog.require('goog.dom');
goog.require('goog.userAgent');


/**
 * Gets the scrollbar width from the browser.
 * The implementation is inspired by
 * {@code goog.editor.SeamlessField.getScrollbarThickness_}.
 *
 * Note: This is buggy in at least XP SP2 IE6 (both 32 and 64-bit), where it
 * returns 0.
 *
 * @return {number} The scrollbar width in pixels.
 *
 */
cw.env.getScrollbarThickness_ = function() {
	var div = goog.dom.createDom('div',
		{'style': 'overflow:scroll;position:absolute;visibility:hidden;'});
	goog.dom.appendChild(goog.dom.getDocument().body, div);
	try {
		return div.offsetWidth - div.clientWidth;
	} finally {
		goog.dom.removeNode(div);
	}
}


/**
 * Get the version of the installed Flash Player plugin, for Internet Explorer
 * only.
 *
 * @return {?string} The Flash Player version, or {@code null} if not installed.
 */
cw.env.getActiveXFlashVersion_ = function() {
	var flashVersion = null, ax;
	var sfString = 'ShockwaveFlash';
	sfString += '.' + sfString; // now "ShockwaveFlash.ShockwaveFlash"

	/** @preserveTry */
	try {
		// Try 7 first, since we know we can use GetVariable with it
		ax = new ActiveXObject(sfString + '.7');
		flashVersion = ax.GetVariable('$version');
	} catch (e) {
		// Try 6 next, some versions are known to crash with GetVariable calls
		/** @preserveTry */
		try {
			ax = new ActiveXObject(sfString + '.6');
			flashVersion = '6';  // minimum is 6.0.21
		} catch (e2) {
			/** @preserveTry */
			try {
				// Try the default activeX
				ax = new ActiveXObject(sfString);
				flashVersion = ax.GetVariable('$version');
			} catch (e3) {
				// No flash
			}
		}
	}

	return flashVersion;
};


/**
 * Compress the signature string returned by the {@link cw.env.getAllPlugins_}
 * into a smaller string.
 *
 * @param {string} psig The plugin signature string.
 *
 * @return {string} The compressed signature.
 */
cw.env.compressPluginSignature_ = function(psig) {
	var checksum = [];

	// The algorithm works conceptually like this:
	// Right-group the string into pairs like: 4[12][89][57][81][21]
	// Use modulus (%) to convert each group into an ASCII-range codepoint
	// Append each one-character string to an array (later concatenated to a string)
	var pos = psig.length + 1;
	while (pos--) {
		if (pos % 2 !== 0 || pos < 2) {
			continue;
		}

		// Confirm the math in {ython with:
		// 	for i in xrange(1000): print (i % (122-65+1)) + 65 ### = 58
		checksum.push(String.fromCharCode(
			parseInt(psig.substr(pos - 2, 2), 10) % 58 + 65));
	}

	checksum = checksum.join(''); // No longer an array

	// Our math above picks codepoints between "A" and "z"
	// But there are 6 codepoints between "Z" and "a": [\]^_`
	// We allow these characters, but we don't like backslashes,
	// so convert each "\" to ":".
	checksum = checksum.replace(/\\/g, ':');

	return checksum;
};


/**
 * Convert a {@code navigator.plugins} pseudo-array into a a real array of
 * arrays containing the information we want. This also returns a
 * (possibly large) "signature" string that uniquely represents the installed
 * plugins 99.9% of the time. The signature array can be further
 * compressed with {@link cw.env.compressPluginSignature_},
 * and used to first ask the server if it wants the full plugin report before
 * sending it.
 *
 * @param {!Array} plugins {@code navigator.plugins} or a similar object.
 *
 * @return {!Array.<(!Array|!Object.<string, number>|string)>} A three-item array:
 * 	[a "copy" of navigator.plugins, a description map, the signature string].
 *
 * TODO: improve above type signature after Closure Compiler supports
 * 	tuple annotations.
 */
cw.env.extractPlugins_ = function(plugins) {
	var pluginList = [];
	// We de-duplicate descriptions in the report because Quicktime has a
	// long description (228 bytes) that is in ~6 different plugins. This
	// "compression" saves space even if Quicktime is not in the plugins.
	// We prepend an underscore to every description in this map to avoid
	// potential conflicts with a description being `toString` or similar.
	var descriptions = {};
	var lastDescriptionNumber = 0;
	var descNum;
	var psig = [];
	psig.push(plugins.length);
	for (var i = 0; i < plugins.length; i++) {
		var p = plugins[i];
		psig.push(i);
		psig.push(p.length);
		psig.push(p.name.length);
		psig.push(p.description.length);
		psig.push(p.filename.length);
		var numbers = (p.name + p.description + p.filename).match(/[0-9]/g);
		if(numbers && numbers.length) {
			psig.push(numbers.join(''));
		}
		descNum = descriptions['_' + p.description];
		if(descNum == null) { // or undefined
			descNum = lastDescriptionNumber;
			descriptions['_' + p.description] = lastDescriptionNumber++;
		}
		pluginList.push([p.name, descNum, p.filename, []]);
		for (var j = 0; j < p.length; j++) { // p.length is the length of the mimetypes
			var m = p[j];
			// A copy/paste from above; p. changed to m.
			descNum = descriptions['_' + m.description];
			if(descNum == null) { // or undefined
				descNum = lastDescriptionNumber;
				descriptions['_' + m.description] = lastDescriptionNumber++;
			}
			pluginList[i][3].push([m.type, m.suffixes, descNum]); // 3 because it's last []
		}
	}

	// psig is concatenated into a string like "128957812736781"
	return [pluginList, descriptions, psig.join('')];
};


/**
 * Convert the properties from an object onto a new object that has
 * the original object's properties, except for properties that
 * point to objects, arrays, or functions.
 *
 * @param {!(Object|Navigator|Document)} orig
 *
 * @return {!Object} The filtered object
 */
cw.env.filterObject_ = function(orig) {
	var out = {};
	var allowed = {'string': 1, 'number': 1, 'null': 1, 'boolean': 1};
	for(var k in orig) {
		/** @preserveTry */
		try {
			var v = orig[k];
			if(goog.typeOf(v) in allowed) {
				out[k] = v;
			}
		} catch(e) {
			// Several browsers have problems accessing some properties of `document`.
			// Firefox has problems accessing `document.domConfig` and throws:
			// Exception... "Component returned failure code: 0x80004001
			// 	(NS_ERROR_NOT_IMPLEMENTED) [nsIDOM3Document.domConfig]
			// IE8 has problems accessing `document.fileUpdatedDate` and throws:
			// Error: Invalid argument.
			out[k] = ['ERROR', {
				'string': e.toString(), 'name': e.name,
				'message': e.message, 'stack': e.stack}];
		}
	}
	return out;
}


/**
 * Extract the interesting properties from a window object.
 *
 * @param {!Object} orig Any non-null object
 *
 * @return {!Object} The filtered object
 */
cw.env.filterWindow_ = function(orig) {
	var out = {};
	var allowed = {
		'innerWidth': 1, 'innerHeight': 1, 'outerWidth': 1, 'outerHeight': 1,
		'screenX': 1, 'screenY': 1, 'screenLeft': 1, 'screenTop': 1, 'fullScreen': 1,
		'maxConnectionsPerServer': 1, 'offscreenBuffering': 1};
	for(var k in allowed) {
		if(k in orig) {
			out[k] = orig[k];
		}
	}
	// filterObject_ just in case we got some unexpected arrays/objects/functions.
	return cw.env.filterObject_(out);
}


/**
 * Gather a lot of information from the browser environment
 * and return an object.
 */
cw.env.makeReport_ = function() {
	var date = new Date();

	var report = {};

	// If you make even the slightest change to how the report is generated,
	// you MUST increment this to the current date and time, and
	// you MUST use UTC, not your local time.
	report['_version'] = 20100331.0612;

	report['_type'] = 'browser-environment-initial';

	report['window'] = cw.env.filterWindow_(goog.global);

	if(goog.global.navigator) {
		report['navigator'] = cw.env.filterObject_(/** @type {!Navigator} */(navigator));

		// navigator.javaEnabled is a `function` in FF; an `object` in IE8.
		if(navigator.javaEnabled) {
			try {
				report['navigator.javaEnabled()'] = navigator.javaEnabled();
			} catch(e) { /* TODO: remove this if we never see it in the wild */
				report['navigator.javaEnabled()'] = 'Error: ' + e;
			}
		}

		if(navigator.taintEnabled) {
			try {
				report['navigator.taintEnabled()'] = navigator.taintEnabled();
			} catch(e) { /* TODO: remove this if we never see it in the wild */
				report['navigator.taintEnabled()'] = 'Error: ' + e;
			}
		}

		if(navigator.plugins) {
			var ret = cw.env.extractPlugins_(navigator.plugins);
			report['pluginList'] = ret[0];
			report['pluginDescs'] = ret[1];
		}

		if(navigator.mimeTypes) {
			report['navigator.mimeTypes.length'] = navigator.mimeTypes.length;
		}
	}

	if(goog.global.document) {
		report['document'] = cw.env.filterObject_(document);
	}

	if(goog.global.screen) {
		report['screen'] = cw.env.filterObject_(screen);
	}

	if(goog.global.history && goog.isNumber(history.length)) {
		report['history.length'] = history.length;
	}

	report['new Date().getTime()'] = +date;
	report['new Date().getTimezoneOffset()'] = date.getTimezoneOffset();

	if(goog.userAgent.IE) {
		report['Flash Player ActiveX Control version'] = cw.env.getActiveXFlashVersion_();
	}

	report['_timeToCollect'] = goog.now() - +date;

	return report;
}

/**
 * Functions to collect various information about the environment.
 */

goog.provide('cw.env');

goog.require('goog.dom');
goog.require('goog.userAgent');
goog.require('goog.debug');


/**
 * Gets the scrollbar width from the browser.
 * The implementation is inspired by
 * {@code goog.editor.SeamlessField.getScrollbarThickness_}.
 *
 * Note: This is buggy in at least XP SP2 IE6 (both 32 and 64-bit), where it
 * returns 0.
 *
 * @return {number} The scrollbar width in pixels.
 */
cw.env.getScrollbarThickness = function() {
	var div = goog.dom.createDom('div',
		{'style': 'visibility:hidden;overflow:scroll;position:absolute;' +
			'top:0;width:100px;height:100px'});
	goog.dom.appendChild(goog.dom.getDocument().body, div);
	try {
		return div.offsetWidth - div.clientWidth;
	} finally {
		goog.dom.removeNode(div);
	}
};


/**
 * Get the version of the installed Flash Player plugin, for Internet Explorer
 * only.
 *
 * @return {?string} The Flash Player version, or {@code null} if not installed.
 */
cw.env.getActiveXFlashVersion = function() {
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
 * Get the version of the installed Google Gears plugin, for Internet Explorer
 * only.
 *
 * @return {?string}
 */
cw.env.getActiveXGoogleGearsBuildInfo = function() {
	try {
		var factory = new ActiveXObject('Gears.Factory');
		return factory['getBuildInfo']();
	} catch(e) {
		return null;
	}
};


/**
 * Get the version of the installed Silverlight plugin, for Internet Explorer
 * only.
 *
 * TODO: Silverlight version detection using binary search to get the exact
 * version.
 *
 * @return {?string}
 */
cw.env.getActiveXSilverlightVersion = function() {
	try {
		var control = new ActiveXObject('AgControl.AgControl');
	} catch(e) {
		return null;
	}
	var version = '?';
	var known = ['1.0', '2.0', '3.0', '4.0', '5.0', '6.0'];
	var n = known.length;
	while(n--) {
		var maybeVer = known[n];
		if(control['IsVersionSupported'](maybeVer)) {
			version = maybeVer;
			break;
		}
	}
	return version;
};


/**
 * Probe for commonly-available ActiveXObjects.
 *
 * @return {!Object.<string, string>}
 */
cw.env.probeActiveXObjects = function() {
	// In the future, we don't want to check these on every page load,
	// because it adds 30-40ms to the collection time.
	var objects = [
		'Microsoft.XMLHTTP',
		'Msxml2.XMLHTTP',
		'Msxml2.XMLHTTP.3.0',
		'Msxml2.XMLHTTP.4.0',
		// DO NOT USE - it pops up infobar in IE8 on Server 2008 R2.
		//'Msxml2.XMLHTTP.5.0',
		'Msxml2.XMLHTTP.6.0',
		'Msxml2.DOMDocument',
		 /* Instantiating htmlfile probably adds 16-30ms to the collection
		 time, but we really want to know if we can. Maybe remove it later. */
		'htmlfile',
		'AcroPDF.PDF.1', /* Adobe Reader plugin, version 7 or above */
		'PDF.PdfCtrl.6' /* Adobe Reader plugin, version 6 */
	];

	// Don't detect 'Gears.Factory' or 'AgControl.AgControl' here because
	// we have separate functions to detect and get their versions.

	var results = {};
	var n = objects.length;
	while(n--) {
		var name = objects[n];
		try {
			results[name] = [1/* means "object toString" */,
				Object.prototype.toString.call(new ActiveXObject(name))];
		} catch(e) {
			results[name] = [0/* means "Error toString" */,
				e.toString()];
		}
	}
	return results;
};


/**
 * @return {?boolean|!Array.<(string|Object)>} If an XMLHttpRequest object
 * 	could be instantiated, returns the default value of its {@code withCredentials}
 * 	property (or null if has no such property). If it could not be instantiated,
 * 	returns an Array containing error information.
 */
cw.env.getXHRDefaultWithCredentials = function() {
	/** @preserveTry */
	try {
		var xhr = new XMLHttpRequest();
		if('withCredentials' in xhr) {
			return xhr['withCredentials'];
		} else {
			return null;
		}
	} catch(e) {
		return ['ERROR', goog.debug.normalizeErrorObject(e)];
	}
};


/**
 * Compress the signature string returned by the {@link cw.env.getAllPlugins_}
 * into a smaller string.
 *
 * @param {string} psig The plugin signature string.
 * @return {string} The compressed signature.
 */
cw.env.compressPluginSignature = function(psig) {
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
 * compressed with {@link cw.env.compressPluginSignature},
 * and used to first ask the server if it wants the full plugin report before
 * sending it.
 *
 * @param {!Array} plugins {@code navigator.plugins} or a similar object.
 * @return {!Array.<(!Array|!Object.<string, number>|string)>} A three-item array:
 * 	[a "copy" of navigator.plugins, a description map, the signature string].
 * // TODO: types for tuples
 */
cw.env.extractPlugins = function(plugins) {
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
			// `m` is almost always a non-null MimeType here, but in rare
			// cases it is `null`. Around 2010-04, we observed `null` in
			// at least two browsers:
			// BlackBerry8110/4.5.0.182 Profile/MIDP-2.0 Configuration/CLDC-1.1 VendorID/102 Novarra-Vision/8.0
			// SonyEricssonW995/R1GA Browser/NetFront/3.4 Profile/MIDP-2.1 Configuration/CLDC-1.1 JavaPlatform/JP-8.4.4 Novarra-Vision/8.0
			if(m == null) { // or undefined
				continue;
			}

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
 * @return {!Object} The filtered object
 */
cw.env.filterObject = function(orig) {
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
			out[k] = ['ERROR', goog.debug.normalizeErrorObject(e)];
		}
	}
	return out;
};


/**
 * Extract the interesting properties from a window object.
 *
 * @param {!Object} orig Any !Object, but preferably one with the properties
 * 	we're looking for.
 * @return {!Object} The filtered object
 */
cw.env.filterWindow = function(orig) {
	var out = {};
	var allowed = {
		'innerWidth': 1, 'innerHeight': 1, 'outerWidth': 1, 'outerHeight': 1,
		'screenX': 1, 'screenY': 1, 'screenLeft': 1, 'screenTop': 1, 'fullScreen': 1,
		'maxConnectionsPerServer': 1, 'offscreenBuffering': 1};
	for(var k in allowed) {
		if(k in orig) {
			try {
				out[k] = orig[k];
			} catch(e) {
				// try/catch every property access, because around 2010-04,
				// we observed this error in Gecko GranParadiso/3.0.11
				// and Gecko/20100315 Firefox/3.5.9:
				//
				// Component returned failure code: 0x80004005 (NS_ERROR_FAILURE)
				// [nsIDOMWindowInternal.outerWidth]
				//
				// This may be caused by race conditions during the page load.
				out[k] = ['ERROR', goog.debug.normalizeErrorObject(e)];
			}
		}
	}
	// filterObject just in case we got some unexpected arrays/objects/functions.
	return cw.env.filterObject(out);
};


/**
 * Return an Object containing the properties of the
 * {@code window.location} object.
 * @return {!Object}
 */
cw.env.getLocation = function() {
	var out = {};
	var props = ['hash', 'host', 'hostname', 'href', 'pathname', 'port', 'protocol', 'search'];
	var n = props.length;
	while(n--) {
		var k = props[n];
		try {
			out[k] = goog.global.location[k];
		} catch(e) {
			// No errors expected, but catch them anyway.
			out[k] = ['ERROR', goog.debug.normalizeErrorObject(e)];
		}
	}
	return out;
};


/**
 * Gather a lot of information from the browser environment
 * and return an object.
 *
 * Notes for offline analysis (incomplete):
 * 	Before 20100408.2226, ['ERROR', ...] was sometimes 'Error: ...'
 * 	Before 20100409.0001, report included 'has working XMLHttpRequest',
 * 		which was incorrect because it was always {@code true}.
 */
cw.env.makeReport = function() {
	var date = new Date();

	var report = {};

	// If you make even the slightest change to how the report is generated,
	// you MUST increment this to the current date and time, and
	// you MUST use UTC, not your local time.
	report['_version'] = 20100625.0010;

	report['_type'] = 'browser-environment-initial';

	report['window'] = cw.env.filterWindow(goog.global);

	if(goog.global.navigator) {
		var nav = goog.global.navigator;

		report['navigator'] = cw.env.filterObject(/** @type {!Navigator} */(nav));

		// navigator.javaEnabled is a `function` in FF; an `object` in IE8.
		if('javaEnabled' in nav) {
			try {
				report['navigator.javaEnabled()'] = nav.javaEnabled();
			} catch(e) { /* TODO: remove this if we never see it in the wild */
				report['navigator.javaEnabled()'] = ['ERROR', goog.debug.normalizeErrorObject(e)];
			}
		}

		if(nav.plugins) {
			var ret = cw.env.extractPlugins(nav.plugins);
			report['pluginList'] = ret[0];
			report['pluginDescs'] = ret[1];
		}

		if(nav.mimeTypes) {
			report['navigator.mimeTypes.length'] = nav.mimeTypes.length;
		}
	}

	if(goog.global.document) {
		report['document'] = cw.env.filterObject(document);
	}

	if(goog.global.location) {
		report['location'] = cw.env.getLocation();
	}

	if(goog.global.screen) {
		report['screen'] = cw.env.filterObject(screen);
	}

	if(goog.global.history) {
		try {
			var length = goog.global.history.length;
			if(goog.isNumber(length)) {
				report['history.length'] = length;
			}
		} catch(e) {
			// Around 2010-04, we saw a report where accessing history.length on
			// "Mozilla/5.0 (X11; U; Linux x86_64; en-US; rv:1.9.0.16) Gecko/2009121707
			// CentOS/3.0.16-1.el5.centos Firefox/3.0.16" resulted in error:
			//
			// Component returned failure code: 0x80004005 (NS_ERROR_FAILURE) [nsIDOMHistory.length]
			// See https://bugzilla.mozilla.org/show_bug.cgi?id=429550
			//
			// We observed this again on 2010-06-11 (Firefox 3.0.18) because
			// we failed to fix the bug.
			report['history.length'] = ['ERROR', goog.debug.normalizeErrorObject(e)];
		}
	}

	report['scrollbarThickness'] = cw.env.getScrollbarThickness();
	report['XHR.withCredentials'] = cw.env.getXHRDefaultWithCredentials();

	report['new Date().getTime()'] = +date;
	report['new Date().getTimezoneOffset()'] = date.getTimezoneOffset();

	if(goog.userAgent.IE) {
		report['Flash Player ActiveX Control version'] = cw.env.getActiveXFlashVersion();
		report['Google Gears ActiveX Control version'] = cw.env.getActiveXGoogleGearsBuildInfo();
		report['Silverlight ActiveX Control version'] = cw.env.getActiveXSilverlightVersion();
		report['ActiveXObjects'] = cw.env.probeActiveXObjects();
	}

	report['_timeToCollect'] = goog.now() - +date;

	return report;
};

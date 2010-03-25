/**
 * Functions to collect various information about the environment.
 */

goog.provide('cw.env');

goog.require('goog.editor.SeamlessField');


cw.env.getScrollbarThickness_ = goog.editor.SeamlessField.getScrollbarThickness_;

/**
 * Get the version of the installed Flash Player plugin, for Internet Explorer
 * only.
 *
 * @return {?string} The Flash Player version, or {@code null} if not installed.
 */
cw.env.getFlashVersionInIE = function() {
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
 * Get all of the installed plugins (in non-IE browsers), along with a
 * large "signature" string that uniquely represents the installed
 * plugins 99.9% of the time. The signature array can be further
 * compressed with {@link cw.env.compressPluginSignature_},
 * and used to first ask the server if it wants the full plugin
 * report before sending it.
 *
 * @param {!Array} plugins {@code navigator.plugins} or a similar object.
 *
 * @return {!Array.<(!Array.<!Array.<(string|!Array.<string>)>>|string)>} A two-item array:
 * 	[a "copy" of navigator.plugins, the signature string].
 */
cw.env.getAllPlugins_ = function(plugins) {
	var pluginList = [];
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
		pluginList.push([p.name, p.description, p.filename, []]);
		for (var j = 0; j < p.length; j++) { // p.length is the length of the mimetypes
			var m = p[j];
			// These just bloat the psig
			//psig.push(m.type.length);
			//psig.push(m.suffixes.length);
			//psig.push(m.description.length);
			pluginList[i][3].push([m.type, m.suffixes, m.description]); // 3 because it's last []
		}
	}

	// psig is concatenated into a string like "128957812736781"
	return [pluginList, psig.join('')];
};

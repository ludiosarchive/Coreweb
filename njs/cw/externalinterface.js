goog.provide('cw.externalinterface');

/**
 * These functions were modified from the ones Flash Player injects into the page.
 *
 * Modifications:
 * 	uses array .join("") to be faster in JScript, where string appends are very slow.
 * 	detects Arrays and Dates properly, even if they originated in another window.
 *	(TODO) properly escapes keys in objects
 */

// TODO: add closure type annotations

/**
 * @param {!Array} buffer Temporary buffer
 * @param {!Array} obj Array to encode
 */
cw.externalinterface.handleArray_ = function(buffer, obj) {
	buffer.push('<array>');
	for (var len = obj.length, i = 0; i < len; i++) {
		buffer.push('<property id="', i, '">');
		cw.externalinterface.handleAny_(buffer, obj[i]);
		buffer.push('</property>');
	}
	buffer.push('</array>');
}

/**
 * @param {!Array} buffer Temporary buffer
 * @param {!Object} obj Argument pseudo-array to encode
 * @param {number} index Which argument to start at
 */
cw.externalinterface.handleArguments_ = function(buffer, obj, index) {
	buffer.push('<arguments>');
	for (var len = obj.length, i = index; i < len; i++) {
		cw.externalinterface.handleAny_(buffer, obj[i]);
	}
	buffer.push('</arguments>');
}

/**
 * @param {!Array} buffer Temporary buffer
 * @param {!Object} obj Object to encode
 */
cw.externalinterface.handleObject_ = function(buffer, obj) {
	buffer.push('<object>');
	var s = '<object>';
	for (var prop in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, prop)) {
			buffer.push('<property id="', prop, '">'); // TODO: needs escaping! Needs tests!
			cw.externalinterface.handleAny_(buffer, obj[prop]);
			buffer.push('</property>');
		}
	}
	buffer.push('</object>');
}

cw.externalinterface.escapeString_ = function(s) {
	// TODO: is ' -> apos really needed? If not, we might use goog.string.htmlEscape
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/**
 * @param {!Array} buffer Temporary buffer
 * @param {*} value Value to encode
 */
cw.externalinterface.handleAny_ = function(buffer, value) {
	var type = goog.typeOf(value);
	switch(type) {
		case 'string':
			buffer.push('<string>', cw.externalinterface.escapeString_(value), '</string>');
			break;
		case 'number':
			buffer.push('<number>', value, '</number>');
			break;
		case 'boolean':
			buffer.push(value ? '<true/>' : '<false/>');
			break;
		case 'undefined':
			buffer.push('<undefined/>');
			break;
		case 'array':
			cw.externalinterface.handleArray_(buffer, value);
			break;
		case 'object':
			// `getFullYear' check is identical to the one in goog.isDateLike
			if(typeof value.getFullYear == 'function' && typeof value.getTime == 'function') {
				buffer.push('<date>', value.getTime(), '</date>');
			} else {
				cw.externalinterface.handleObject_(buffer, value);
			}
			break;
		default: // matches 'null', 'function', and possibly more if goog.typeOf changes.
			buffer.push('<null/>');
			break;
	}
}

/**
 * Returns the XML string that can be used to call an ExternalInterface-exposed Flash function,
 * with arguments, on an any embedded Flash applet.
 *
 * @param {string} name The name of the function to invoke.
 * @param {...*} var_args The arguments to the function.
 * 
 * @return {string} The XML string that can be used in
 * 	<code>var result = flashObj.CallFunction(xmlString)</code>.
 */
cw.externalinterface.request = function(name, var_args) {
	var buffer = ['<invoke name="', name, '" returntype="javascript">'];
	cw.externalinterface.handleArguments_(buffer, arguments, 1)
	buffer.push('</invoke>');
	return buffer.join('');
}

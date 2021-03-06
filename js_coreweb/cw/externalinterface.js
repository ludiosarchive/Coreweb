/**
 * @fileoverview A JS->Flash ExternalInterface that is fast and not broken
 * 	(unlike what Flash Player injects into the page.)
 */

goog.provide('cw.externalinterface');

goog.require('goog.string');


/**
 * These functions were modified from the ones Flash Player injects into the page
 * (the ones named __flash__*)
 *
 * Improvements over the injected __flash__* functions:
 * 	escapes object keys properly, so the XML serialization is not corrupted.
 * 	uses array .join("") to be faster in JScript, where string appends are very slow.
 * 	detects Arrays and Dates properly, even if they originated in another window.
 *   uses Closure Compiler type annotations, so hopefully the encoder is inlined into
 *		one function.
 *
 * Keep in mind that JS->Flash is slightly more lossy than Flash->JS, because
 * invalid surrogates, Noncharacters, and unallocated Specials may be U+FFFD'ed.
 * On the Flash->JS side (with the cw.json encoder), all characters < 32 or >= 127
 * are escaped, so there should be no lossiness in strings.
 *
 *
 * Note that for Flash->JS calls (ExternalInterface.call), Flash will use its own injected
 * __flash__toXML function to grab the return value.  If you want to use the fixed serializer
 * for this, something like this might work (completely untested):
 *
 * window.__flash__toXML = function(obj) {
 * 	var buffer = [];
 * 	cw.externalinterface.handleAny_(buffer, obj);
 * 	return buffer.join('');
 * }
 *
 * Note that if the JS function raises when called from Flash, Flash will
 * receive the value null (serialized as <null/>).  There is no way to change this.
 */


/**
 * Append to `buffer' an XML-serialized version of array `obj'
 *
 * @param {!Array} buffer Temporary buffer
 * @param {!Array} obj Array to encode
 * @private
 */
cw.externalinterface.handleArray_ = function(buffer, obj) {
	buffer.push('<array>');
	for (var len = obj.length, i = 0; i < len; i++) {
		buffer.push('<property id="', i, '">');
		cw.externalinterface.handleAny_(buffer, obj[i]);
		buffer.push('</property>');
	}
	buffer.push('</array>');
};

/**
 * Append to `buffer' an XML-serialized version of argument array
 * `obj', ignoring items before `index'.
 *
 * @param {!Array} buffer Temporary buffer
 * @param {!Object} obj Argument pseudo-array to encode
 * @param {number} index Which argument to start at
 * @private
 */
cw.externalinterface.handleArguments_ = function(buffer, obj, index) {
	buffer.push('<arguments>');
	for (var len = obj.length, i = index; i < len; i++) {
		cw.externalinterface.handleAny_(buffer, obj[i]);
	}
	buffer.push('</arguments>');
};

/**
 * Append to `buffer' an XML-serialized version of object `obj'.
 *
 * @param {!Array} buffer Temporary buffer
 * @param {!Object} obj Object to encode
 * @private
 */
cw.externalinterface.handleObject_ = function(buffer, obj) {
	buffer.push('<object>');
	for (var prop in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, prop)) {
			// Skip over functions on the object
			if(goog.typeOf(obj[prop]) == 'function') {
				continue;
			}
			buffer.push('<property id="', cw.externalinterface.escapeString_(prop), '">');
			cw.externalinterface.handleAny_(buffer, obj[prop]);
			buffer.push('</property>');
		}
	}
	buffer.push('</object>');
};

/**
 * @param {string} s String to escape
 * @return {string} Escaped string
 * @private
 */
cw.externalinterface.escapeString_ = function(s) {
	return goog.string.htmlEscape(s);
};

/**
 * Append to `buffer' an XML-serialized version of value {@code value}.
 * If {@code value} is a non-Array Object, any functions on the object
 * are skipped.
 *
 * @param {!Array} buffer Temporary buffer
 * @param {*} value Value to encode
 * @private
 */
cw.externalinterface.handleAny_ = function(buffer, value) {
	var type = goog.typeOf(value);
	switch(type) {
		case 'string':
			buffer.push('<string>', cw.externalinterface.escapeString_(
				/** @type {string} */ (value)), '</string>');
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
			cw.externalinterface.handleArray_(buffer, /** @type {!Array} */ (value));
			break;
		case 'object':
			// `getFullYear' check is identical to the one in goog.isDateLike
			if(typeof value.getFullYear == 'function') {
				buffer.push('<date>', value.valueOf(), '</date>');
			} else {
				cw.externalinterface.handleObject_(buffer, /** @type {!Object} */ (value));
			}
			break;
		default: // matches 'null', 'function', 'unknown', and possibly more if goog.typeOf changes.
			buffer.push('<null/>');
			break;
	}
};

/**
 * Returns the XML string that can be used to call an ExternalInterface-exposed
 * Flash function, with arguments, on an any embedded Flash applet.
 *
 * @param {string} name The name of the function to invoke.  Must not contain
 * 	the characters C{<>&"'}.
 * @param {...*} var_args The arguments to the function.
 * @return {string} The XML string that can be used in
 * 	{@code var result = flashObj.CallFunction(xmlString)}.
 */
cw.externalinterface.request = function(name, var_args) {
	var buffer = ['<invoke name="', name, '" returntype="javascript">'];
	cw.externalinterface.handleArguments_(buffer, arguments, 1)
	buffer.push('</invoke>');
	return buffer.join('');
};

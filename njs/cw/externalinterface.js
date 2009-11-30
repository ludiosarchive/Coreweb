goog.provide('cw.externalinterface');

/**
 * These functions were modified from the ones Flash Player injects into the page.
 * They are now not completely broken, and faster.
 */

// TODO: optimize - don't check .length every time
// TODO: optimize - use array join; push to just one array to do everything
// TODO: closure type annotations

cw.externalinterface.arrayToXML = function(obj) {
	var s = '<array>';
	for (var i = 0; i < obj.length; i++) {
		s += '<property id="' + i + '">' + cw.externalinterface.toXML(obj[i]) + '</property>';
	}
	return s + '</array>';
}

cw.externalinterface.argumentsToXML = function(obj, index) {
	var s = '<arguments>';
	for (var i = index; i < obj.length; i++) {
		s += cw.externalinterface.toXML(obj[i]);
	}
	return s + '</arguments>';
}

cw.externalinterface.objectToXML = function(obj) {
	var s = "<object>";
	for (var prop in obj) {
		s += '<property id="' + prop + '">' + cw.externalinterface.toXML(obj[prop]) + "</property>";
	}
	return s + '</object>';
}

cw.externalinterface.escapeXML = function(s) {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

cw.externalinterface.toXML = function(value) {
	var type = goog.typeOf(value);
	switch(type) {
		case 'string':
			return '<string>' + cw.externalinterface.escapeXML(value) + '</string>';
		case 'undefined':
			return '<undefined/>';
		case 'number':
			return '<number>' + value + '</number>';
		case 'boolean':
			return value ? '<true/>' : '<false/>';
		case 'array':
			return cw.externalinterface.arrayToXML(value);
		case 'object':
			// `getFullYear' check is identical to the one in goog.isDateLike
			if(typeof value.getFullYear == 'function' && typeof value.getTime == 'function') {
				return '<date>' + value.getTime() + '</date>';
			} else {
				return cw.externalinterface.objectToXML(value);
			}
		default: // matches 'null', 'function', and possibly more if goog.typeOf changes.
			return '<null/>';
	}
}

cw.externalinterface.request = function(name) {
	return '<invoke name="' + name + '" returntype="javascript">' + cw.externalinterface.argumentsToXML(arguments, 1) + '</invoke>';
}

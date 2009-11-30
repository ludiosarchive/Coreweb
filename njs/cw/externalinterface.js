goog.provide('cw.externalinterface');

/**
 * These functions were modified from the ones Flash Player injects into the page.
 * They are now not completely broken, and faster.
 */

// TODO: optimize - don't check .length every time
// TODO: optimize - use array join
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
	var type = typeof value;
	if (type == 'string') {
		return '<string>' + cw.externalinterface.escapeXML(value) + '</string>';
	} else if (type == 'undefined') {
		return '<undefined/>';
	} else if (type == 'number') {
		return '<number>' + value + '</number>';
	} else if (value == null) {
		return '<null/>';
	} else if (type == 'boolean') {
		return value ? '<true/>' : '<false/>';
	} else if (value instanceof Date) {
		return '<date>' + value.getTime() + '</date>';
	} else if (value instanceof Array) {
		return cw.externalinterface.arrayToXML(value);
	} else if (type == 'object') {
		return cw.externalinterface.objectToXML(value);
	} else {
		return '<null/>'; //???
	}
}

cw.externalinterface.request = function(name) {
	return '<invoke name="' + name + '" returntype="javascript">' + cw.externalinterface.argumentsToXML(arguments, 1) + '</invoke>';
}

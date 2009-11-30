goog.provide('cw.externalinterface');

/**
 * These functions were modified from the ones Flash Player injects into the page.
 * They are now not completely broken, and faster.
 */

// TODO: optimize - don't check .length every time
// TODO: optimize - use array join; push to just one array to do everything
// TODO: closure type annotations

cw.externalinterface.arrayToXML = function(buffer, obj) {
	buffer.push('<array>');
	for (var len = obj.length, i = 0; i < len; i++) {
		buffer.push('<property id="', i, '">');
		cw.externalinterface.toXML(buffer, obj[i]);
		buffer.push('</property>');
	}
	buffer.push('</array>');
}

cw.externalinterface.argumentsToXML = function(buffer, obj, index) {
	buffer.push('<arguments>');
	for (var len = obj.length, i = index; i < len; i++) {
		cw.externalinterface.toXML(buffer, obj[i]);
	}
	buffer.push('</arguments>');
}

cw.externalinterface.objectToXML = function(buffer, obj) {
	buffer.push('<object>');
	var s = '<object>';
	for (var prop in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, prop)) {
			buffer.push('<property id="', prop, '">'); // TODO: needs escaping! Needs tests!
			cw.externalinterface.toXML(buffer, obj[prop]);
			buffer.push('</property>');
		}
	}
	buffer.push('</object>');
}

cw.externalinterface.escapeXML = function(s) {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

cw.externalinterface.toXML = function(buffer, value) {
	var type = goog.typeOf(value);
	switch(type) {
		case 'string':
			buffer.push('<string>', cw.externalinterface.escapeXML(value), '</string>');
			break;
		case 'undefined':
			buffer.push('<undefined/>');
			break;
		case 'number':
			buffer.push('<number>', value, '</number>');
			break;
		case 'boolean':
			buffer.push(value ? '<true/>' : '<false/>');
			break;
		case 'array':
			cw.externalinterface.arrayToXML(buffer, value);
			break;
		case 'object':
			// `getFullYear' check is identical to the one in goog.isDateLike
			if(typeof value.getFullYear == 'function' && typeof value.getTime == 'function') {
				buffer.push('<date>', value.getTime(), '</date>');
			} else {
				cw.externalinterface.objectToXML(buffer, value);
			}
			break;
		default: // matches 'null', 'function', and possibly more if goog.typeOf changes.
			buffer.push('<null/>');
			break;
	}
}

cw.externalinterface.request = function(name) {
	var buffer = ['<invoke name="', name, '" returntype="javascript">'];
	cw.externalinterface.argumentsToXML(buffer, arguments, 1)
	buffer.push('</invoke>');
	return buffer.join('');
}

/**
 * @fileoverview Provides a set of common global properties that may exist
 * 	in a browser environment. Not comprehensive.
 */

goog.provide('cw.globalprops');


/**
 * @private
 */
cw.globalprops.makeExpectedGlobalProperties_ = function() {
	var globalsArray = [];

	// *** From qooxdoo/qooxdoo/tool/pylib/ecmascript/frontend/lang.py ***

	// Builtin names
	globalsArray = globalsArray.concat([
		"ActiveXObject", "Array", "Boolean", "Date", "document",
		"DOMParser", "Element", "Error", "Event", "Function", "Image",
		"Math", "navigator", "Node", "Number", "Object", "Option",
		"RegExp", "String", "window", "XMLHttpRequest", "XMLSerializer",
		"XPathEvaluator", "XPathResult", "Range"
	]);

	globalsArray = globalsArray.concat([
		// Java
		"java", "sun", "Packages",

		// Firefox Firebug, Webkit, IE8, maybe others:
		"console",

		// IE
		"event", "offscreenBuffering", "clipboardData", "clientInformation",
		"external", "screenTop", "screenLeft",

		// window
		'addEventListener', '__firebug__', 'location', 'netscape',
		'XPCNativeWrapper', 'Components', 'parent', 'top', 'scrollbars',
		'name', 'scrollX', 'scrollY', 'scrollTo', 'scrollBy', 'getSelection',
		'scrollByLines', 'scrollByPages', 'sizeToContent', 'dump',
		'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
		'setResizable', 'captureEvents', 'releaseEvents', 'routeEvent',
		'enableExternalCapture', 'disableExternalCapture', 'prompt', 'open',
		'openDialog', 'frames', 'find', 'self', 'screen', 'history',
		'content', 'menubar', 'toolbar', 'locationbar', 'personalbar',
		'statusbar', 'directories', 'closed', 'crypto', 'pkcs11',
		'controllers', 'opener', 'status', 'defaultStatus', 'innerWidth',
		'innerHeight', 'outerWidth', 'outerHeight', 'screenX', 'screenY',
		'pageXOffset', 'pageYOffset', 'scrollMaxX', 'scrollMaxY', 'length',
		'fullScreen', 'alert', 'confirm', 'focus', 'blur', 'back', 'forward',
		'home', 'stop', 'print', 'moveTo', 'moveBy', 'resizeTo', 'resizeBy',
		'scroll', 'close', 'updateCommands',

		'atob', 'btoa', 'frameElement', 'removeEventListener', 'dispatchEvent',
		'getComputedStyle', 'sessionStorage', 'globalStorage',

		// Language
		"decodeURI", "decodeURIComponent", "encodeURIComponent",
		"escape", "unescape", "parseInt", "parseFloat", "isNaN", "isFinite",

		"this", "arguments", "undefined", "NaN", "Infinity"
	]);

	// *** from http://msdn.microsoft.com/en-us/library/ms535873%28VS.85%29.aspx ***/
	// (copy/paste from IE -> Excel; save as csv, use Python to parse)

	globalsArray = globalsArray.concat(
		['closed', 'constructor', 'defaultStatus', 'dialogArguments',
		'dialogHeight', 'dialogLeft',  'dialogTop', 'dialogWidth',
		'frameElement', 'length', 'localStorage',  'maxConnectionsPerServer',
		'name', 'offscreenBuffering', 'opener', 'parent',  'returnValue',
		'screenLeft', 'screenTop', 'self', 'sessionStorage', 'status', 'top',
		'XDomainRequest', 'XMLHttpRequest', 'frames', 'onafterprint',
		'onbeforedeactivate',  'onbeforeprint', 'onbeforeunload', 'onblur',
		'onerror', 'onfocus', 'onhashchange',  'onhelp', 'onload', 'onmessage',
		'onunload', 'alert', 'attachEvent', 'blur', 'clearInterval',
		'clearTimeout', 'close', 'confirm', 'createPopup', 'detachEvent',
		'execScript', 'focus',  'item', 'moveBy', 'moveTo',
		'msWriteProfilerMark', 'navigate', 'open', 'postMessage',  'print',
		'prompt', 'resizeBy', 'resizeTo', 'scroll', 'scrollBy', 'scrollTo',
		'setInterval',  'setTimeout', 'showHelp', 'showModalDialog',
		'showModelessDialog', 'toStaticHTML',  'clientInformation',
		'clipboardData', 'document', 'event', 'external', 'history', 'Image',
		'location', 'navigator', 'Option', 'screen']);

	// *** from http://code.google.com/p/doctype/wiki/WindowObject ***
	// (copy/paste into text file, use Python to parse)

	globalsArray = globalsArray.concat(
		['clientInformation', 'clipboardData', 'closed', 'content',
		'controllers', 'crypto', 'defaultStatus', 'dialogArguments',
		'dialogHeight', 'dialogLeft', 'dialogTop', 'dialogWidth', 'directories',
		'event', 'frameElement', 'frames', 'fullScreen', 'globalStorage',
		'history', 'innerHeight', 'innerWidth', 'length', 'location',
		'locationbar', 'menubar', 'name', 'navigator', 'offscreenBuffering',
		'opener', 'outerHeight', 'outerWidth', 'pageXOffset', 'pageYOffset',
		'parent', 'personalbar', 'pkcs11', 'returnValue', 'screen',
		'screenLeft', 'screenTop', 'screenX', 'screenY', 'scrollbars',
		'scrollMaxX', 'scrollMaxY', 'scrollX', 'scrollY', 'self',
		'sessionStorage', 'sidebar', 'status', 'statusbar', 'toolbar', 'top',
		'XMLHttpRequest', 'window', 'alert', 'atob', 'attachEvent', 'back',
		'blur', 'btoa', 'captureEvents', 'clearInterval', 'clearTimeout',
		'close', 'confirm', 'createPopup', 'disableExternalCapture',
		'detachEvent', 'dispatchEvent', 'dump', 'enableExternalCapture',
		'escape', 'execScript', 'find', 'focus', 'forward', 'getComputedStyle',
		'getSelection', 'home', 'moveBy', 'moveTo', 'navigate', 'open',
		'openDialog', 'print', 'prompt', 'releaseEvents', 'removeEventListener',
		'resizeBy', 'resizeTo', 'routeEvent', 'scroll', 'scrollBy',
		'scrollByLines', 'scrollByPages', 'scrollTo', 'setActive',
		'setInterval', 'setResizable', 'setTimeout', 'showHelp',
		'showModalDialog', 'showModelessDialog', 'sizeToContent', 'stop',
		'unescape', 'updateCommands']);

	// *** Top-level functions (the Qoxdoo section is missing some) ***
	// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Functions
	// + escape, unescape
	globalsArray = globalsArray.concat([
		"decodeURI", "decodeURIComponent", "encodeURI", "encodeURIComponent",
		"eval", "escape", "unescape", "parseInt", "parseFloat", "isNaN", "isFinite"]);

	// *** Modern Firebug ***
	globalsArray = globalsArray.concat(
		['_firebug', '_FirebugCommandLine', 'loadFirebugConsole']);

	// *** Firefox 3.5.3 ***
	globalsArray = globalsArray.concat(
		['GetWeakReference', 'XPCSafeJSObjectWrapper', 'getInterface',
		'postMessage', 'applicationCache']);

	// *** More IE stuff ***
	globalsArray = globalsArray.concat(['CollectGarbage']);

	// *** cw, goog ***
	globalsArray = globalsArray.concat(['cw', 'goog']);

	// Now turn it into an object

	var expectedGlobalProperties = {};
	var n = globalsArray.length;
	while(n--) {
		expectedGlobalProperties[globalsArray[n]] = true;
	}

	return expectedGlobalProperties;
};


if(goog.DEBUG) {
	cw.globalprops.properties = cw.globalprops.makeExpectedGlobalProperties_();
} else {
	cw.globalprops.properties = {};
}

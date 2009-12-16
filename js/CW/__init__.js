/* {LICENSE:Coreweb,Nevow} */

goog.require('goog.object');

//] if _debugMode:

/**
 * In JScript, when named function expressions are used, they clobber the scope,
 * unlike every other browser.
 *
 *  The list of globals below helps prevent bugs in the code that uses cw.Class
 * (which usually implies using named functions).
 *
 * For example, it will prevent the addition of a method
 * `function window() {}' or `function print() {}'. If we would not prevent it, the
 * `print' method would get added, and another method might assume that
 * `print()' actually prints the page (while now it actually does something unrelated).
 */

CW._globalsArray = [];

// *** From qooxdoo/qooxdoo/tool/pylib/ecmascript/frontend/lang.py ***

// Builtin names
CW._globalsArray = CW._globalsArray.concat([
	"ActiveXObject", "Array", "Boolean", "Date", "document",
	"DOMParser", "Element", "Error", "Event", "Function", "Image",
	"Math", "navigator", "Node", "Number", "Object", "Option",
	"RegExp", "String", "window", "XMLHttpRequest", "XMLSerializer",
	"XPathEvaluator", "XPathResult", "Range"
]);

CW._globalsArray = CW._globalsArray.concat([
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

CW._globalsArray = CW._globalsArray.concat(
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
	'location', 'navigator', 'Option', 'screen']
);

// *** from http://code.google.com/p/doctype/wiki/WindowObject ***
// (copy/paste into text file, use Python to parse)

CW._globalsArray = CW._globalsArray.concat(
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
	'unescape', 'updateCommands']
);

// *** Top-level functions (the Qoxdoo section is missing some) ***
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Functions
// + escape, unescape
CW._globalsArray = CW._globalsArray.concat([
	"decodeURI", "decodeURIComponent", "encodeURI", "encodeURIComponent",
	"eval", "escape", "unescape", "parseInt", "parseFloat", "isNaN", "isFinite",
]);

// *** Modern Firebug ***
CW._globalsArray = CW._globalsArray.concat(
	['_firebug', '_FirebugCommandLine', 'loadFirebugConsole']
);

// *** Firefox 3.5.3 ***
CW._globalsArray = CW._globalsArray.concat(
	['GetWeakReference', 'XPCSafeJSObjectWrapper', 'getInterface',
	'postMessage', 'applicationCache']
);

// *** More IE stuff ***
CW._globalsArray = CW._globalsArray.concat(['CollectGarbage']);

// *** cw, goog ***
CW._globalsArray = CW._globalsArray.concat(['cw', 'goog']);

// Now turn it into an object

CW._globalsLength = CW._globalsArray.length;
CW._globalNames = {};
while(CW._globalsLength--) {
	CW._globalNames[CW._globalsArray[CW._globalsLength]] = true;
}
delete CW._globalsLength;
delete CW._globalsArray;

//] endif


// Should we automatically run the tests with _debugMode = False; too? Probably,
// that's the only way to make sure they're still passing.


/**
 * This tracks the number of instances of L{CW.Class} subclasses.
 * This is incremented for each instantiation; never decremented.
 */
CW.__instanceCounter__ = 0;

/**
 *  C{CW._CONSTRUCTOR} chosen to be C{{}} because it has the nice property of
 *    ({} === {}) === false
 *    (CW._CONSTRUCTOR === CW._CONSTRUCTOR) === true
 *
 *    which avoids any ambiguitity when "instantiating" instances.
 */
CW._CONSTRUCTOR = {};

CW.Class = function() {};

/**
 * Create a new subclass.
 *
 * Passing a module object for C{classNameOrModule} and C{subclassName} will
 * result in the subclass being added to the global variables, allowing for a
 * more concise method of defining a subclass.
 *
 * @type classNameOrModule: C{String} or a module object
 * @param classNameOrModule: Name of the new subclass or the module object
 *	 C{subclassName} should be created in
 *
 * @type subclassName: C{String} or C{undefined}
 * @param subclassName: Name of the new subclass if C{classNameOrModule} is a
 *	 module object
 *
 * @rtype: C{CW.Class}
 */
CW.Class.subclass = function(classNameOrModule, /*optional*/ subclassName) {
	CW.__classDebugCounter__ += 1;

	/*
	 * subclass() must always be called on CW.Class or an object returned
	 * from subclass() - so in this execution context, C{this} is the "class"
	 * object.
	 */
	var superClass = this;

	/* speed up access for JScript */
	var CONSTRUCTOR = CW._CONSTRUCTOR;

	/*
	 * Create a constructor function that wraps the user-defined __init__.
	 * This basically serves the purpose of type.__call__ in Python.
	 */
	var subClass = function(asConstructor) {
		var self;
		if (this instanceof subClass) {
			/*
			 * If the instance is being created using C{new Class(args)},
			 * C{this} will already be an object with the appropriate
			 * prototype, so we can skip creating one ourself.
			 */
			self = this;
		} else {
			/*
			 * If the instance is being created using just C{Class(args)} (or,
			 * similarly, C{Class.apply(null, args)} or C{Class.call(null,
			 * args)}), then C{this} is actually some random object - maybe the
			 * global execution context object, maybe the window, maybe a
			 * pseudo-namespace object (ie, C{CW}), maybe null.  Whichever,
			 * invoke C{new subClass(CW._CONSTRUCTOR)} to create an object
			 * with the right prototype without invoking C{__init__}.
			 */
			self = new subClass(CONSTRUCTOR);
		}
		/*
		 * Once we have an instance, if C{asConstructor} is not the magic internal
		 * object C{CW._CONSTRUCTOR}, pass all our arguments on to the
		 * instance's C{__init__}.
		 */
		if (asConstructor !== CONSTRUCTOR) {
			/* increment __instanceCounter__ and set an ID unique to this instance */
			self.__id__ = ++CW.__instanceCounter__;

			self.__class__ = subClass;
			self.__init__.apply(self, arguments);
		}

		/*
		 * We've accomplished... Something.  Either we made a blank, boring
		 * instance of a particular class, or we actually initialized an
		 * instance of something (possibly something that we had to create).
		 * Whatever it is, give it back to our caller to enjoy.
		 */
		return self;
	};

	/*
	 * This is how you spell inheritance in JavaScript.
	 */
	subClass.prototype = new superClass(CONSTRUCTOR);

	/*
	 * Make the subclass subclassable in the same way.
	 */
	subClass.subclass = CW.Class.subclass;

	/*
	 * Support both new and old-style subclassing.
	 *
	 * New-style takes fewer bytes.
	 *
	 * Old-style is still useful (especially for unit testing UnitTest) because it doesn't
	 * bind the class to a property, it only returns it.
	 */
	var className;
	if (subclassName !== undefined) {
		/* new style subclassing */
		className = classNameOrModule.__name__ + '.' + subclassName;

//] if _debugMode:
		if(classNameOrModule[subclassName] !== undefined) {
			// throw an Error instead of something like CW.NameCollisionError
			// because we don't have subclassing yet, and if we define it later, it might
			// have a typo that triggers this condition; at this point you'll see a strange
			// ReferenceError here.
			throw new Error("CW.Class.subclass: Won't overwrite " + className);
		}
//] endif
		// Now define it so that it can actually be accessed later.
		classNameOrModule[subclassName] = subClass;
	} else {
		/* old style subclassing */
		className = classNameOrModule;
	}

	/**
	 * upcall is similar to Python super()
	 * Use upcall like this:
	 * CW.Defer.FirstError.upcall(self, '__init__', []);
	 */
	subClass.upcall = function(otherThis, methodName, funcArgs) {
		return superClass.prototype[methodName].apply(otherThis, funcArgs);
	};

//] if _debugMode:
	// This only helps prevent problems caused by JScript's mishandling of named functions.

	subClass._alreadyDefinedMethods = {};

	// Pretty much any object has a toString method. _alreadyDefinedMethods is used
	// as a set to keep track of already-defined methods (to detect a programming error at
	// runtime: where the same method name is accidentally used twice).
	// For .method(function toString() {}) to work, toString must be made undefined here.
	subClass._alreadyDefinedMethods.toString = undefined;

	/**
	 * Throw an Error if this method has already been defined.
	 */
	subClass._prepareToAdd = function(methodName, allowWindowPropertyNames) {
		if(subClass._alreadyDefinedMethods[methodName] !== undefined) {
			// See explanation above for why Error instead of a CW.NameCollisionError
			throw new Error("CW.Class.subclass.subClass: Won't overwrite already-defined " +
				subClass.__name__ + '.' + methodName);
		}
		if(!allowWindowPropertyNames) {
			if(CW._globalNames[methodName] === true) {
				throw new Error("CW.Class.subclass.subClass: Won't create " +
					subClass.__name__ + '.' + methodName +
					" because window." + methodName + " may exist in some browsers.");
			}
		}
		subClass._alreadyDefinedMethods[methodName] = true;
	}
//] endif

	/**
	 * Helper function for adding a method to the prototype.
	 *
	 * C{methodFunction} will be called with its class instance as the first argument,
	 *    so that you will not have to do: C{var self = this;} in each method.
	 * Classes with prototypes created with method/methods will be slower than
	 * those with prototypes created by directly setting C{.prototype}
	 */
	subClass.method = function(methodFunction) {
		/* .name is a Mozilla extension to JavaScript */
		var methodName = methodFunction.name;

		if (methodName == undefined) {
			/* No C{methodFunction.name} in IE or Opera or older Safari, so try this workaround. */
			var methodSource = methodFunction.toString();
			methodName = methodSource.slice(
				methodSource.indexOf(' ') + 1, methodSource.indexOf('('));
		}

//] if _debugMode:
		subClass._prepareToAdd(methodName, /*allowWindowPropertyNames=*/false);

		/*
		 * Safari 4 supports displayName to name any function for the debugger/profiler.
		 * It might work with Firebug in the future.
		 * See http://code.google.com/p/chromium/issues/detail?id=17356 for details.
		 */
		methodFunction.displayName = className + '.' + methodName;
//] endif

		subClass.prototype[methodName] = function() {
			var args = [this];
			args.push.apply(args, arguments); // A sparkling jewel.

			// TODO: microbench against:
			// var args = Array.prototype.slice.call(arguments);
			// args.unshift(this);
			return methodFunction.apply(this, args);
		};

		subClass.prototype[methodName].displayName = className + '.' + methodName + ' (self wrap)'
	};

	/**
	 * Add many methods from an array of named functions.
	 * This wraps each function with a function that passes in `this' as the first argument.
	 * See comment for subClass.method.
	 */
	subClass.methods = function() {
		var n = arguments.length;
		// order does not matter
		while(n--) {
			subClass.method(arguments[n]);
		}
	};


	/**
	 * Add many methods from an object. Functions can be anonymous.
	 * This doesn't wrap the functions (.methods/.method does) for slightly better speed.
	 * Use this instead of .methods for performance-critical classes.
	 *
	 * JScript will not enumerate over things that it should (including `toString').
	 * See https://developer.mozilla.org/En/ECMAScript_DontEnum_attribute#JScript_DontEnum_Bug
	 * If you want to define a custom `toString' method for instances, do not use .pmethods.
	 * 
	 * Side note: YUI yui-core.js works around this with:
	 * var fn = s.toString;
       * if (L.isFunction(fn) && fn != Object.prototype.toString) {
       *    r.toString = fn;
	 * }
	 */
	subClass.pmethods = function(obj) {
		for(var methodName in obj) {
			var methodFunction = obj[methodName];

//] if _debugMode:
			/**
			 * Check _alreadyDefinedMethods even though objects can't have two of
			 * the same property; because the user could be using pmethods() to
			 * accidentally overwrite a method set with methods()
			 */
			subClass._prepareToAdd(methodName, /*allowWindowPropertyNames=*/true);

			// See comment about Safari 4 above.
			methodFunction.displayName = className + '.' + methodName;
//] endif

			subClass.prototype[methodName] = methodFunction;
		}
	};


	/**
	 * Return C{true} if class C{a} is a subclass of class {b} (or is {b}).
	 * Return C{false} otherwise.
	 */
	subClass.subclassOf = function(superClass) {
		return (subClass.prototype instanceof superClass
				|| subClass == superClass);
	};

	/*
	 * Make the subclass identifiable somehow.
	 */
	subClass.__name__ = className;

	subClass.toString = function() {
		return '<Class ' + className + '>';
	};
	subClass.prototype.toString = function() {
		return '<"Instance" of ' + className + '>';
	};
	return subClass;
};


CW.Class.prototype.__init__ = function() {
	//CW.msg("In CW.Class.prototype.__init__");
};


// TODO: update Node logger to use Closure Library logging. Use Closure's TextFormatter.

// TODO: Log to file? Log to stderr?
//if(window.node && window.ENV && window.ENV.UNITTEST_LOGFILE) {
//
//	CW.logger._beforeOpenedBuffer = "";
//
//	node.fs.open(
//		window.ENV.UNITTEST_LOGFILE,
//		node.O_WRONLY | node.O_TRUNC | node.O_CREAT, 0644).addCallback(
//			function (file) {
//				CW.logger._openLogFile = file;
//				node.fs.write(CW.logger._openLogFile, CW.logger._beforeOpenedBuffer, null, "utf8");
//				CW.logger._beforeOpenedBuffer = null;
//			}
//	);
//
//	CW.logger.addObserver(function _CW_file_log_observer(evt) {
//		var prepend;
//		if (evt.isError) {
//			prepend = "CW error: ";
//		} else {
//			prepend = "CW log: ";
//		}
//
//		function appendLine(prefix, message) {
//			msg = '[' + CW.localTime() + '] ' + prefix + message + '\n';
//			if(CW.logger._openLogFile) {
//				node.fs.write(CW.logger._openLogFile, msg, null, "utf8");
//			} else {
//				CW.logger._beforeOpenedBuffer += msg;
//			}
//		}
//
//		appendLine(prepend, evt.message);
//
//		if (evt.isError) {
//			appendLine('', evt.error);
//			if(evt.error.stack) {
//				appendLine('', evt.error.stack);
//			}
//		}
//	});
//}


/**
 * Raised by CW.UnitTest to indicate that a test has failed. For your
 * own asserts, use goog.asserts
 */
CW.AssertionError = function(opt_msg) {
	goog.debug.Error.call(this, opt_msg);
};
goog.inherits(CW.AssertionError, goog.debug.Error);
CW.AssertionError.prototype.name = 'CW.AssertionError';


/**
 * Retrieve an C{Array} of C{String}s naming the methods defined on the given
 * class and its parent classes.
 */
CW.methods = function(cls) {
	if (typeof cls != "function") {
		throw new Error("Only classes have methods.");
	}
	var result = [];
	return result.concat(goog.object.getKeys(cls.prototype)).sort();
};

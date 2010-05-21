/**
 * @fileoverview cw.Class allows you to make classes
 * 	without typing `prototype` and the class name all the time.
 *
 * It works almost exactly like Divmod JS's Divmod.Class.
 *
 * For examples, see all of Coreweb's Test* files.
 */

goog.provide('cw.Class');
goog.provide('cw.makeExpectedGlobalProperties_');
goog.provide('cw.expectedGlobalProperties');


if(goog.DEBUG) { // TODO: use goog.asserts to make this unnecesssary?

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
	 *
	 * @private
	 */
	cw.makeExpectedGlobalProperties_ = function() {

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
	}

	cw.expectedGlobalProperties = cw.makeExpectedGlobalProperties_();
}


cw.Class = function() {};

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
 * @rtype: C{cw.Class}
 */
cw.Class.subclass = function(classNameOrModule, /*optional*/ subclassName) {
	/*
	 * subclass() must always be called on cw.Class or an object returned
	 * from subclass() - so in this execution context, C{this} is the "class"
	 * object.
	 */
	var superClass = this;

	/* speed up access for JScript */
	var CONSTRUCTOR = cw.Class._CONSTRUCTOR;

	/*
	 * Create a constructor function that wraps the user-defined __init__.
	 * This basically serves the purpose of type.__call__ in Python.
	 */
	var subClass = function _cw_Class_subClassConstructor(asConstructor) {
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
			 * invoke C{new subClass(cw.Class._CONSTRUCTOR)} to create an object
			 * with the right prototype without invoking C{__init__}.
			 */
			self = new subClass(CONSTRUCTOR);
		}
		/*
		 * Once we have an instance, if C{asConstructor} is not the magic internal
		 * object C{cw.Class._CONSTRUCTOR}, pass all our arguments on to the
		 * instance's C{__init__}.
		 */
		if (asConstructor !== CONSTRUCTOR) {
			/* increment __instanceCounter__ and set an ID unique to this instance */
			self.__id__ = ++cw.Class.__instanceCounter__;

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
	subClass.subclass = cw.Class.subclass;

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

		if(goog.DEBUG && classNameOrModule[subclassName] !== undefined) {
			// throw an Error instead of something like cw.NameCollisionError
			// because we don't have subclassing yet, and if we define it later, it might
			// have a typo that triggers this condition; at this point you'll see a strange
			// ReferenceError here.
			throw new Error("cw.Class.subclass: Won't overwrite " + className);
		}

		// Now define it so that it can actually be accessed later.
		classNameOrModule[subclassName] = subClass;
	} else {
		/* old style subclassing */
		className = classNameOrModule;
	}

	/**
	 * upcall is similar to Python super()
	 * Use upcall like this:
	 * cw.Defer.FirstError.upcall(self, '__init__', []);
	 */
	subClass.upcall = function _cw_Class_subClass_upcall(otherThis, methodName, funcArgs) {
		return superClass.prototype[methodName].apply(otherThis, funcArgs);
	};


	if(goog.DEBUG) {
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
				// See explanation above for why Error instead of a cw.NameCollisionError
				throw new Error("cw.Class.subclass.subClass: Won't overwrite already-defined " +
					subClass.__name__ + '.' + methodName);
			}
			if(!allowWindowPropertyNames) {
				if(cw.expectedGlobalProperties[methodName] === true) {
					throw new Error("cw.Class.subclass.subClass: Won't create " +
						subClass.__name__ + '.' + methodName +
						" because window." + methodName + " may exist in some browsers.");
				}
			}
			subClass._alreadyDefinedMethods[methodName] = true;
		}
	}

	/**
	 * Helper function for adding a method to the prototype.
	 *
	 * C{methodFunction} will be called with its class instance as the first argument,
	 *    so that you will not have to do: C{var self = this;} in each method.
	 * Classes with prototypes created with method/methods will be slower than
	 * those with prototypes created by directly setting C{.prototype} properties
	 */
	subClass.method = function(methodFunction) {
		/* .name is a Mozilla extension to JavaScript, also supported in WebKit */
		var methodName = methodFunction.name;

		if (methodName == undefined) {
			/* No C{methodFunction.name} in IE or Opera or older Safari, so try this workaround. */
			var methodSource = methodFunction.toString();
			methodName = methodSource.slice(
				methodSource.indexOf(' ') + 1, methodSource.indexOf('('));
		}

		if(goog.DEBUG) {
			subClass._prepareToAdd(methodName, /*allowWindowPropertyNames=*/false);

			/*
			 * Safari 4 supports displayName to name any function for the debugger/profiler.
			 * It might work with Firebug in the future.
			 * See http://code.google.com/p/chromium/issues/detail?id=17356 for details.
			 */
			methodFunction.displayName = className + '.' + methodName;
		}

		subClass.prototype[methodName] = function _cw_Class_subClass_prototype_method() {
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

			if(goog.DEBUG) {
				/**
				 * Check _alreadyDefinedMethods even though objects can't have two of
				 * the same property; because the user could be using pmethods() to
				 * accidentally overwrite a method set with methods()
				 */
				subClass._prepareToAdd(methodName, /*allowWindowPropertyNames=*/true);

				// See comment about Safari 4 above.
				methodFunction.displayName = className + '.' + methodName;
			}

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


cw.Class.prototype.__init__ = function() {
	//cw.msg("In cw.Class.prototype.__init__");
};


/**
 * This tracks the number of instances of L{cw.Class} subclasses.
 * This is incremented for each instantiation; never decremented.
 */
cw.Class.__instanceCounter__ = 0;

/**
 *  C{cw._CONSTRUCTOR} chosen to be C{{}} because it has the nice property of
 *    ({} === {}) === false
 *    (cw._CONSTRUCTOR === cw._CONSTRUCTOR) === true
 *
 *    which avoids any ambiguitity when "instantiating" instances.
 */
cw.Class._CONSTRUCTOR = {};

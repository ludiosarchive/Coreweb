/**
 * @fileoverview cw.Class allows you to make classes
 * 	without typing `prototype` and the class name all the time.
 *
 * It works almost exactly like Divmod JS's Divmod.Class.
 *
 * For examples, see all of Coreweb's Test* files.
 */

goog.provide('cw.Class');

goog.require('cw.globalprops');
goog.require('goog.structs.Set');


/**
 * @constructor
 */
cw.Class = function() {
};

/**
 * Create a new subclass.
 *
 * Passing a module object for {@code classNameOrModule} and {@code subclassName} will
 * result in the subclass being added to the global variables, allowing for a
 * more concise method of defining a subclass.
 *
 * @param {string|!Object} classNameOrModule Name of the new subclass,
 * 	or the module object {@code subclassName} should be created in
 *
 * @param {string=} subclassName: If {@code classNameOrModule} is a module
 * 	object, specify the name of the new subclass.
 *
 * @return {!Function}
 */
cw.Class.subclass = function(classNameOrModule, subclassName) {
	/**
	 * subclass() must always be called on cw.Class or an object returned
	 * from subclass() - so in this execution context, {@code this} is the "class"
	 * object.
	 */
	var superClass = this;

	/* speed up access for JScript */
	var CONSTRUCTOR = cw.Class.CONSTRUCTOR_;

	/**
	 * Create a constructor function that wraps the user-defined __init__.
	 * This basically serves the purpose of type.__call__ in Python.
	 *
	 * @constructor
	 */
	var subClass = function _cw_Class_subClassConstructor(asConstructor) {
		var self;
		if (this instanceof subClass) {
			/**
			 * If the instance is being created using `new Class(args)`,
			 * `this` will already be an object with the appropriate
			 * prototype, so we can skip creating one ourself.
			 */
			self = this;
		} else {
			/**
			 * If the instance is being created using just `Class(args)` (or,
			 * similarly, `Class.apply(null, args)} or `Class.call(null, args)`),
			 * then `this` is actually some random object - maybe the
			 * global execution context object, maybe the window, maybe a
			 * pseudo-namespace object (ie, `cw`), maybe `null`.  Whichever,
			 * invoke `new subClass(cw.Class.CONSTRUCTOR_)` to create an object
			 * with the right prototype without invoking `__init__`.
			 */
			self = new subClass(CONSTRUCTOR);
		}
		/**
		 * Once we have an instance, if `asConstructor` is not the magic internal
		 * object `cw.Class.CONSTRUCTOR_`, pass all our arguments on to the
		 * instance's `__init__`.
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
	if (goog.isDef(subclassName)) {
		/* new style subclassing */
		className = classNameOrModule.__name__ + '.' + subclassName;

		if(goog.DEBUG && goog.isDef(classNameOrModule[subclassName])) {
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
		// This only helps prevent problems caused by IE6-8's mishandling of named functions.

		/**
		 * @type {!goog.structs.Set}
		 */
		subClass.alreadyDefinedMethods_ = new goog.structs.Set();

		/**
		 * Throw an Error if this method has already been defined.
		 */
		subClass._prepareToAdd = function(methodName, allowWindowPropertyNames) {
			if(subClass.alreadyDefinedMethods_.contains(methodName)) {
				// See explanation above for why Error instead of a cw.NameCollisionError
				throw new Error("cw.Class.subclass.subClass: Won't overwrite already-defined " +
					subClass.__name__ + '.' + methodName);
			}
			if(!allowWindowPropertyNames) {
			 	// If any named function passed to .method() or .methods()
				// conflicts with a global property name, throw Error instead
				// of letting a confusing disaster happen. The disaster happens
				// only in IE6-8, where named functions clobber the scope.
				// Note that we prevent such methods in all browsers.
				// An example: this prevents the addition of a method like
 				// `function window() {}' or `function print() {}'. If we
				// don't prevent these, the `print' method would get added,
				// and another method might assume that `print()' actually
				// prints the page (while now it actually does something unrelated).
				if(cw.globalprops.properties.contains(methodName)) {
					throw new Error("cw.Class.subclass.subClass: Won't create " +
						subClass.__name__ + '.' + methodName +
						" because window." + methodName + " may exist in some browsers.");
				}
			}
			subClass.alreadyDefinedMethods_.add(methodName);
		}
	}

	/**
	 * Helper function for adding a method to the prototype.
	 *
	 * `methodFunction` will be called with its class instance as the first argument,
	 * so that you will not have to do: `var self = this;` anywhere.
	 * Classes with prototypes created with method(...)/methods(...) are slower than
	 * those with prototypes created by directly setting `.prototype` properties
	 *
	 * @param {!Function} methodFunction
	 */
	subClass.method = function(methodFunction) {
		/* .name is a Mozilla extension to JavaScript, also supported in WebKit */
		var methodName = methodFunction.name;

		if (methodName == undefined) {
			/* No `methodFunction.name` in IE or Opera or older Safari, so try this workaround. */
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
			args.push.apply(args, arguments);
			return methodFunction.apply(this, args);
		};

		subClass.prototype[methodName].displayName = className + '.' + methodName + ' (self wrap)';
	};

	/**
	 * Add many methods from an array of named functions.
	 * This wraps each function with a function that passes in
	 * `this' as the first argument. See comment for subClass.method.
	 *
	 * @param {...!Function} var_args The methods to add.
	 */
	subClass.methods = function(var_args) {
		for(var i=0; i < arguments.length; i++) {
			subClass.method(arguments[i]);
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
				 * Check alreadyDefinedMethods_ even though objects can't have two of
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
	 * @return {boolean} Whether this class is a subclass of
	 * 	{@code superClass}, or is {@code superClass}.
	 */
	subClass.subclassOf = function(superClass) {
		return (subClass.prototype instanceof superClass
				|| subClass == superClass);
	};

	/**
	 * Make the subclass identifiable somehow.
	 * @type {string}
	 */
	subClass.__name__ = /** @type {string} */ (className);

	/**
	 * @return {string}
	 */
	subClass.toString = subClass.__repr__ = function() {
		return '<Class ' + className + '>';
	};

	/**
	 * @return {string}
	 */
	subClass.prototype.toString = subClass.prototype.__repr__ = function() {
		return '<"Instance" of ' + className + '>';
	};

	return subClass;
};


cw.Class.prototype.__init__ = function() {
};


/**
 * This tracks the number of instances of {@link cw.Class} subclasses.
 * This is incremented for each instantiation; never decremented.
 * @private
 */
cw.Class.__instanceCounter__ = 0;

/**
 * {@code cw.CONSTRUCTOR_} is a non-primitive object {@code {}}
 *    because ({} === {}) === false, while
 *    (cw.CONSTRUCTOR_ === cw.CONSTRUCTOR_) === true
 * @private
 */
cw.Class.CONSTRUCTOR_ = {};

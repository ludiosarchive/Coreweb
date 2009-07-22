/* {LICENSE:primary,Nevow} */

// TODO: remove this; use JS macros only.
CW._debugMode = true;

CW.vars = function(obj) {
	var L = [];
	for (var i in obj) {
		L.push([i, obj[i]]);
	}
	return L;
};


CW.dir = function(obj) {
	var L = [];
	for (var i in obj) {
		L.push(i);
	}
	return L;
};


CW.__classDebugCounter__ = 0;

/**
 * This tracks the number of instances of L{CW.Class} subclasses.
 */
CW.__instanceCounter__ = 0;

/* C{CW._CONSTRUCTOR} chosen to be C{{}} because it has the nice property of
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
CW.Class.subclass = function(classNameOrModule, /* optional */ subclassName) {
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
	 * Create a function which basically serves the purpose of type.__call__ in Python:
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

		if(CW._debugMode) {
			if(classNameOrModule[subclassName] !== undefined) {
				throw new Error("CW.Class.subclass: Won't overwrite " + className);
			}
		}
		// Now define it so that it can actually be accessed later.
		classNameOrModule[subclassName] = subClass;
	} else {
		/* old style subclassing */
		className = classNameOrModule;
	}

	var classIdentifier;
	if(className === undefined) {
		classIdentifier = '#' + CW.__classDebugCounter__;
	} else {
		classIdentifier = className;
	}

	subClass.upcall = function(otherThis, methodName, funcArgs) {
		return superClass.prototype[methodName].apply(otherThis, funcArgs);
	};

	if(CW._debugMode) {
		subClass._alreadyDefinedMethods = {};
		// Pretty much any object has a toString method. _alreadyDefinedMethods is used
		// as a set to keep track of already-defined methods (to detect a programming error at
		// runtime: where the same method name is accidentally used twice).
		// For .method(function toString() {}) to work, toString must be made undefined here.
		subClass._alreadyDefinedMethods.toString = undefined;
	}

	/*
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
			/* No C{methodFunction.name} in IE or Opera or earlier Safari, so try this workaround. */
			var methodSource = methodFunction.toString();
			methodName = methodSource.slice(
				methodSource.indexOf(' ') + 1, methodSource.indexOf('('));
		}

		if(CW._debugMode) {
			if(subClass._alreadyDefinedMethods[methodName] !== undefined) {
				throw new Error("CW.Class.subclass.subClass.method: Won't overwrite " +
					subClass.__name__ + '.' + methodName);
			}

			subClass._alreadyDefinedMethods[methodName] = true;

			/*
			 * Safari 4 supports displayName to name any function for the debugger/profiler.
			 * It might work with Firebug in the future.
			 * See http://code.google.com/p/chromium/issues/detail?id=17356 for details.
			 */

			// TODO: test that displayName is set. Only set displayName in debugging mode.

			methodFunction.displayName = className + '.' + methodName;
		}

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

	/*
	 * Add many methods. See comment for subClass.method.
	 */
	subClass.methods = function() {
		var n = arguments.length;
		// in reverse
		while(n--) {
			subClass.method(arguments[n]);
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
		return '<Class ' + classIdentifier + '>';
	};
	subClass.prototype.toString = function() {
		return '<"Instance" of ' + classIdentifier + '>';
	};
	return subClass;
};


CW.Class.prototype.__init__ = function() {
	CW.debug("In CW.Class.prototype.__init__");
	/* throw new Error("If you ever hit this code path something has gone horribly wrong");
	 */
};

/**
 * Base class for all error classes.
 *
 * @ivar stack: On Firefox, a string describing the call stack at the time the
 * error was instantiated (/not/ thrown).
 */
CW.Error = CW.Class.subclass("CW.Error");
CW.Error.methods(
	function __init__(self, /* optional */ message) {
		self.message = message;
		self.stack = Error().stack;
	},

	/**
	 * Represent this error as a string.
	 *
	 * @rtype: string
	 * @return: This error, as a string.
	 */
	function toString(self) {
		return self.__name__ + ': ' + self.message;
	}
);

/**
 * Sequence container index out of bounds.
 */
CW.IndexError = CW.Error.subclass("CW.IndexError");


/**
 * Base class for all warning classes.
 */
CW.Warning = CW.Class.subclass("CW.Warning");
CW.DeprecationWarning = CW.Warning.subclass("CW.DeprecationWarning");

CW.Module = CW.Class.subclass('CW.Module');
CW.Module.method(
	function __init__(self, name) {
		self.name = name;
	}
);


CW.Logger = CW.Class.subclass('CW.Logger');
CW.Logger.methods(
	function __init__(self) {
		self.observers = [];
	},

	function addObserver(self, observer) {
		self.observers.push(observer);
		return function() {
			self._removeObserver(observer);
		};
	},

	function _removeObserver(self, observer) {
		for (var i = 0; i < self.observers.length; ++i) {
			if (observer === self.observers[i]) {
				self.observers.splice(i, 1);
				return;
			}
		}
	},

	function _emit(self, event) {
		var errors = [];
		var obs = self.observers.slice();
		for (var i = 0; i < obs.length; ++i) {
			try {
				obs[i](event);
			} catch (e) {
				self._removeObserver(obs[i]);
				errors.push([e, "Log observer caused error, removing."]);
			}
		}
		return errors;
	},

	function emit(self, event) {
		var errors = self._emit(event);
		while (errors.length) {
			var moreErrors = [];
			for (var i = 0; i < errors.length; ++i) {
				var e = self._emit({'isError': true, 'error': errors[i][0], 'message': errors[i][1]});
				for (var j = 0; j < e.length; ++j) {
					moreErrors.push(e[j]);
				}
			}
			errors = moreErrors;
		}
	},

	function err(self, error, /* optional */ message) {
		var event = {'isError': true, 'error': error};
		if (message != undefined) {
			event['message'] = message;
		} else {
			event['message'] = error.message;
		}
		self.emit(event);
	},

	function msg(self, message) {
		var event = {'isError': false, 'message': message};
		self.emit(event);
	}
);


CW.logger = new CW.Logger();
CW.msg = function() {
	return CW.logger.msg.apply(CW.logger, arguments);
};

CW.err = function() {
	return CW.logger.err.apply(CW.logger, arguments);
};

CW.debug = function(kind, msg) {
	CW.logger.emit({'isError': false,
			'message': msg, 'debug': true,
			'channel': kind});
};

CW.log = CW.debug;

/**
 * Emit a warning log event.  Warning events have four keys::
 *
 *   isError, which is always C{false}.
 *
 *   message, which is a human-readable explanation of the warning.
 *
 *   category, which is a L{CW.Warning} subclass categorizing the warning.
 *
 *   channel, which is always C{'warning'}.
 */
CW.warn = function warn(message, category) {
	CW.logger.emit({'isError': false,
				'message': message,
				'category': category,
				'channel': 'warning'});
};

/*
 * Set up the Firebug console as a CW log observer.
 */
if(window.firebug) { // non-firebug use can cause infinite loop in Safari 4 (? Confirm later.)
	CW.logger.addObserver(function (evt) {
		if (evt.isError) {
			console.log("CW error: " + evt.message);
			console.log(evt.error);
		} else {
			console.log("CW log: " + evt.message);
		}
	});
}



/**
 * Return C{true} if the two arrays contain identical elements and C{false}
 * otherwise.
 *
 * This assumes that no one has added anything to C{Array.prototype}.
 */
CW.arraysEqual = function arraysEqual(a, b) {
	var i;
	if (!(a instanceof Array && b instanceof Array)) {
		return false;
	}
	if (a.length !== b.length) {
		return false;
	}
	for (i in a) {
		if (!(i in b && a[i] === b[i])) {
			return false;
		}
	}
	for (i in b) {
		if (!(i in a)) {
			return false;
		}
	}
	return true;
};


CW.startswith = function(haystack, starter) {
	return !!(haystack.substr(0, starter.length) === starter); // '==' yields same test results
};


CW.now = function() {
	return +new Date;
};


CW.random = function() {
	return (''+Math.random()).substr(2);
};


/*
 * Adapted from json2.js (version 2008-07-15)
 * 
 * The behavior differs from internal window.JSON parsers:
 *    this json2-adapted version doesn't look at toJSON (does IE8? don't know.)
 *    fewer/more characters are encoded to \u escapes
 *    FF3.1 stringifier will convert \t and other "short characters" to \u escapes instead of \\t 
 *
 * Compared to json2.js, 'safe' parsing was removed. We use eval().
 *
 * L{parseWrapped} JSON-parses already-'()'-wrapped strings.
 * L{preferWrapped} is C{true} if browser can handle '()'-wrapped strings faster
 *    than those that are not '()'-wrapped.
 */
CW.JSON = function() {
	if(window.JSON && JSON.stringify && JSON.parse) {
		CW.debug("Using browser's native JSON stringifier and parser instead of json2/eval.");
		return {
			stringify: JSON.stringify,
			parse: JSON.parse,
			parseWrapped: function(s) {
				CW.debug("Why give CW.JSON '()'-wrapped JSON strings"+
				" when this browser is faster with unwrapped ones?");
				JSON.parse(s.substr(1, s.length-2));
			},
			preferWrapped: false
		};
	}

	// C{escapable} covers all the characters we'll need to specially handle
	var escapeable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

	// C{meta} maps just the simple escapes
	var meta = {'\b':'\\b','\t':'\\t','\n':'\\n','\f':'\\f','\r':'\\r','"' :'\\"','\\':'\\\\'};

	function json_quote(string) {

		// If the string contains no control characters, no quote characters, and no
		// backslash characters, then we can safely slap some quotes around it.
		// Otherwise we must also replace the offending characters with safe escape
		// sequences.

		escapeable.lastIndex = 0;
		return escapeable.test(string) ?
			'"' + string.replace(escapeable, function (a) {
				var c = meta[a];
				// If the character is in meta, use the meta replacement,
				// otherwise, generate a \u escape.
				return typeof c === 'string' ? c : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
			}) + '"' : '"' + string + '"';
	}

	function str(key, holder) {

		// Produce a string from holder[key].

		var i, // loop counter.
			k, // member key.
			v, // member value.
			length,
			partial,
			value = holder[key];

		switch (typeof value) {
			case 'string':
				return json_quote(value);

			case 'number':
				// JSON numbers must be finite. Encode non-finite numbers as null.
				return isFinite(value) ? String(value) : 'null';

			case 'boolean':
				// if JS starts producing 'null' for C{typeof null} some day, add C{case 'null':} on this line.
				return String(value);

			case 'object':
				// If the type is 'object', we might be dealing with an object or an array or null.

				// Due to a specification blunder in ECMAScript, typeof null is 'object'
				if (!value) {
					return 'null';
				}

				// Make an array to hold the partial results of stringifying this object value.
				partial = [];

				// If the object has a dontEnum length property, we'll treat it as an array.
				if (typeof value.length === 'number' && !value.propertyIsEnumerable('length')) {
					// The object is an array. Stringify every element. Use null as a placeholder for non-JSON values.

					length = value.length;
					for (i = 0; i < length; i += 1) {
						partial[i] = str(i, value) || 'null';
					}

					// Join all of the elements together, separated with commas, and wrap them in brackets.

					return '[' + partial.join(',') + ']';
				}

				//iterate through all of the keys in the object.
				// if we get an error here in IE, it's because we're trying to stringify an object that can't be stringified
				for (k in value) {
					if (Object.hasOwnProperty.call(value, k)) {
						v = str(k, value);
						if (v) {
							partial.push(json_quote(k) + ':' + v);
						}
					}
				}

				return '{' + partial.join(',') + '}';
			}
		}

	return {
		stringify: function (value) {
			return str('', {'': value});
		},
		parse: function(value) {
			return eval('(' + value + ')');
		},
		parseWrapped: function(value) {
			return eval(value);
		},
		preferWrapped: false
	};
}();


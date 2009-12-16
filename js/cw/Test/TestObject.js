/**
 * Tests for the CW object model.
 */


goog.require('cw.UnitTest');
goog.require('cw.Class');

goog.provide('cw.Test.TestObject');


cw.UnitTest.TestCase.subclass(cw.Test.TestObject, 'TestObject').methods(

	function test_class(self) {
		var Eater = cw.Class.subclass('Eater');

		Eater.methods(
			function __init__(self, foodFactory) {
				self.food = foodFactory();
			},

			function doEat(self) {
				return self.food + 1;
			}
		);

		Eater.classCounter = 0;

		Eater.classIncr = function() {
			this.classCounter += 1;
		};

		var BetterEater = Eater.subclass('BetterEater');

		BetterEater.methods(
			function __init__(self, foodFactory) {
				BetterEater.upcall(self, "__init__", [foodFactory]);
				self.food += 10;
			});

		var makeFood = function() {
			return 100;
		};

		var be = new BetterEater(makeFood);

		Eater.classIncr();
		Eater.classIncr();
		Eater.classIncr();

		// if attribute-copying 'polymorphism' is in cw.Class.subclass
//		BetterEater.classIncr();
//		BetterEater.classIncr();
		// endif

		// if attribute-copying removed in cw.Class.subclass
		self.assertIdentical(undefined, BetterEater.classIncr);
		// endif

		self.assert(be.doEat() == 111, "explode");

		self.assert(Eater.classCounter == 3, 'classmethod fuckup');

		// if attribute-copying 'polymorphism' is in cw.Class.subclass
//		self.assert(BetterEater.classCounter == 2, 'classmethod fuckup');
		// endif

		// if attribute-copying removed in cw.Class.subclass
		self.assertIdentical(undefined, BetterEater.classCounter);
		// endif
	},


	/**
	 * Using the 2-parameter subclass method creates a subclass and adds the
	 * subclass name to the global namespace.
	 */
	function test_twoParamSubclass(self) {
		var cls = cw.Class.subclass(cw.Test.TestObject, 'InheritTest');
		try {
			self.assertIdentical(cw.Test.TestObject.InheritTest, cls);
			self.assertIdentical(cls.__name__, 'cw.Test.TestObject.InheritTest');
		} finally {
			delete cw.Test.TestObject.InheritTest;
		}
	},


	/**
	 * Modules have a __name__ attribute which gives their name.
	 */
	function test_moduleName(self) {
		var mod = cw.Test.TestObject;
		self.assertIdentical(mod.__name__, 'cw.Test.TestObject');
	},


	/**
	 * Test that cw.Class subclasses have a __name__ attribute which gives
	 * their name.
	 */
	function test_className(self) {
		var cls = cw.Class.subclass("test_object.test_className.cls");
		self.assertIdentical(cls.__name__, "test_object.test_className.cls");

		/* Make sure subclasses don't inherit __name__ from their superclass.
		 */
		var subcls = cls.subclass("test_object.test_className.subcls");
		self.assertIdentical(subcls.__name__, "test_object.test_className.subcls");
	},


	/**
	 * Test that instances of cw.Class have a __class__ attribute which refers
	 * to their class.
	 */
	function test_instanceClassReference(self) {
		var cls = cw.Class.subclass("test_object.test_instanceClassReference.cls");
		var instance;

		instance = cls();
		self.assertIdentical(instance.__class__, cls);

		instance = new cls();
		self.assertIdentical(instance.__class__, cls);

		instance = cls.apply(null, []);
		self.assertIdentical(instance.__class__, cls);

		instance = cls.call(null);
		self.assertIdentical(instance.__class__, cls);
	},

	/**
	 * Calling C{toString} on a L{cw.Class} should return something
	 * informative.
	 */
	function test_classToString(self) {
		var cls = cw.Class.subclass('test_classToString');
		self.assertIdentical(cls.toString(), '<Class test_classToString>');
	},


	/**
	 * Calling C{toString} on a L{cw.Class} instance should return
	 * something informative.
	 */
	function test_instanceToString(self) {
		var cls = cw.Class.subclass('test_instanceToString');
		self.assertIdentical(
			cls().toString(), '<"Instance" of test_instanceToString>');
	},


	/**
	 * Test that L{cw.Class.__instanceCounter__} is not incremented when a new
	 * *class* is created.
	 */
	function test_instanceCounterNoInstances(self) {
		var instanceCounter = cw.Class.__instanceCounter__;
		var cls = cw.Class.subclass('test_instanceCounterNoInstances');
		self.assertIdentical(
			cw.Class.__instanceCounter__,
			instanceCounter);
	},


	/**
	 * Test that L{cw.Class.__instanceCounter__} is incremented when a class is
	 * instantiated.
	 */
	function test_instanceCounterIncremented(self) {
		var cls = cw.Class.subclass('test_instanceCounterIncremented');
		var instanceCounter = cw.Class.__instanceCounter__;
		cls();
		self.assertIdentical(
			cw.Class.__instanceCounter__, instanceCounter + 1);
		cls();
		self.assertIdentical(
			cw.Class.__instanceCounter__, instanceCounter + 2);
	},


	/**
	 * Like L{test_instanceCounterIncremented}, but using the C{new} statement
	 * to instantiate classes.
	 */
	function test_instanceCounterIncrementedNew(self) {
		var cls = cw.Class.subclass('test_instanceCounterIncremented');
		var instanceCounter = cw.Class.__instanceCounter__;
		new cls();
		self.assertIdentical(
			cw.Class.__instanceCounter__, instanceCounter + 1);
		new cls();
		self.assertIdentical(
			cw.Class.__instanceCounter__, instanceCounter + 2);
	},


	/**
	 * Verify that the C{__id__} attribute is not the same for two instances
	 * of the same L{cw.Class}.
	 */
	function test_uniqueID(self) {
		var cls = cw.Class.subclass('test_uniqueID');
		if(cls().__id__ === cls().__id__) {
			self.fail('__id__ attribute not unique');
		}
	},


	function test_newlessInstantiation(self) {
		/*
		 * Test that cw.Class subclasses can be instantiated without using
		 * `new', as well as using .apply() and .call().
		 */
		var SomeClass = cw.Class.subclass("SomeClass");
		SomeClass.methods(
			function __init__(self, x, y) {
				self.x = x;
				self.y = y;
			});

		var a = SomeClass(1, 2);
		self.assert(a.x == 1, "Normal instantiation without new lost an argument");
		self.assert(a.y == 2, "Normal instantiation without new lost an argument");

		var b = SomeClass.apply(null, [1, 2]);
		self.assert(b.x == 1, ".apply() instantiation lost an argument");
		self.assert(b.y == 2, ".apply() instantiation lost an argument");

		var c = SomeClass.call(null, 1, 2);
		self.assert(c.x == 1, ".call() instantiation lost an argument");
		self.assert(c.y == 2, ".call() instantiation lost an argument");
	},


	function test_method(self) {
		var MethodClassTest = cw.Class.subclass('MethodClassTest');

		MethodClassTest.method(function bar(self) {
				return function() {
					return self;
				};
			}
		);

		MethodClassTest.methods(
			function quux(self) {
				return function() { return self; };
			},
			function corge(self) {
				return function() { return self; };
			}
		);

		var mct = new MethodClassTest();

		self.assert(mct.bar()() === mct);
		self.assert(mct.quux()() === mct);
		self.assert(mct.corge()() === mct);
	}
);



cw.UnitTest.TestCase.subclass(cw.Test.TestObject, 'TestBareObject').methods(

	/*
	 * Verify that method/methods-free classes (prototype. only) work fine.
	 */
	function test_bareClass(self) {
		var Bare = cw.Class.subclass('Bare');

		Bare.prototype.__init__ = function(firstFood) {
			this.food = [firstFood];
			this.eatSecond(true);
		}

		Bare.prototype.eatSecond = function(reallyEatSecondFood) {
			if(reallyEatSecondFood === true) {
				this.food.push(6);
			}
		}

		Bare.prototype.doEat = function() {
			this.food.push(3);
		}

		var b = Bare(9);
		b.doEat();

		self.assertArraysEqual([9, 6, 3], b.food);

	}
);



cw.UnitTest.TestCase.subclass(cw.Test.TestObject, 'TestMethodNoOverwrite').methods(
	function setUp(self) {
		if(!goog.DEBUG) {
			throw new cw.UnitTest.SkipTest("Method-overwrite prevention only works with DEBUG");
		}
	},

	/**
	 * Trying to create methods with the same name raises an error.
	 */
	function test_noOverwrite(self) {
		var TempClass = cw.Class.subclass('TempClass');

		var makeSameMethodName = function() {
			TempClass.methods(
				function aMethod(self, differentArity) {
					return 1;
				},

				function aMethod(self) {
					return 2;
				}
			);
		}

		self.assertThrows(Error, makeSameMethodName);
	},

	/**
	 * Make sure that nobody took any shortcuts in the implementation:
	 * overlap should be detected even for `toString'.
	 */
	function test_noOverwriteToString(self) {
		var TempClass = cw.Class.subclass('TempClass');

		var makeSameMethodName = function() {
			TempClass.methods(
				function toString(self) {
					return 1;
				},

				function toString(self) {
					return 2;
				}
			);
		}

		self.assertThrows(Error, makeSameMethodName);
	},

	/**
	 * Adding a method with methods, then adding it with pmethod, should fail.
	 */
	function test_methodsThenPmethods(self) {
		var TempClass = cw.Class.subclass('TempClass');

		/**
		 * JScript is strange: this test won't pass if the method name is `toString'
		 * The reason is that all object literals have a `toString' and JScript will not
		 * iterate over `toString' even if it was explicitly specified as a property.
		 */

		TempClass.methods(
			function aMethod(self) {
				return 1;
			}
		);

		var makeSameMethodName = function() {
			TempClass.pmethods({aMethod: function(){ return 2 }})
		}

		self.assertThrows(Error, makeSameMethodName);

		// Make sure it wasn't added
		var t = new TempClass();
		self.assertIdentical(1, t.aMethod());

	},

	/**
	 * Adding a method with pmethods, then adding it with method, should fail.
	 */
	function test_pmethodsThenMethods(self) {
		var TempClass = cw.Class.subclass('TempClass');

		/**
		 * JScript is strange; this test won't pass if the method name is `toString';
		 * see comment above
		 */

		TempClass.pmethods({aMethod: function(){ return 1 }});

		var makeSameMethodName = function() {
			TempClass.methods(
				function aMethod(self) {
					return 2;
				}
			);
		}

		self.assertThrows(Error, makeSameMethodName);

		// Make sure it wasn't added
		var t = new TempClass();
		self.assertIdentical(1, t.aMethod());
	}
);



cw.UnitTest.TestCase.subclass(cw.Test.TestObject, '_WithTemporary').methods(
	function tearDown(self) {
		try {
			delete cw.Test.__TestClassNoOverwrite_Temporary;
		} catch(e) {}
		try {
			delete cw.Test.__TestBadMethodNames_Temporary;
		} catch(e) {}
		try {
			delete cw.Test.__TestBadMethodNames2_Temporary;
		} catch(e) {}
	}
);



/**
 * Test that new-style subclassing doesn't overwrite anything (except undefined).
 */
cw.Test.TestObject._WithTemporary.subclass(cw.Test.TestObject, 'TestClassNoOverwrite').methods(
	function setUp(self) {
		if(!goog.DEBUG) {
			throw new cw.UnitTest.SkipTest("Class-overwrite prevention only works with DEBUG");
		}
	},

	function test_noOverwriteClass(self) {
		cw.Class.subclass(cw.Test, '__TestClassNoOverwrite_Temporary');

		var makeSameClassName = function() {
			cw.Class.subclass(cw.Test, '__TestClassNoOverwrite_Temporary');
		}

		self.assertThrows(Error, makeSameClassName);
	},


	function test_noOverwriteNumber(self) {
		cw.Test.__TestClassNoOverwrite_Temporary = 4;

		var makeSameClassName = function() {
			cw.Class.subclass(cw.Test, '__TestClassNoOverwrite_Temporary');
		}

		self.assertThrows(Error, makeSameClassName);
	},


	function test_noOverwriteNull(self) {
		cw.Test.__TestClassNoOverwrite_Temporary = null;

		var makeSameClassName = function() {
			cw.Class.subclass(cw.Test, '__TestClassNoOverwrite_Temporary');
		}

		self.assertThrows(Error, makeSameClassName);
	}
);


/**
 * Test that displayName property is set for methods (with DEBUG).
 */
cw.UnitTest.TestCase.subclass(cw.Test.TestObject, 'TestDisplayNameSet').methods(
// TODO
);


/**
 * Test that naming a method something that might be a global object property
 * (like `crypto` or `onbeforeprint`) is illegal with DEBUG
 *
 * (Test with .methods())
 */
cw.Test.TestObject._WithTemporary.subclass(cw.Test.TestObject, 'TestBadMethodNames').methods(
	function setUp(self) {
		if(!goog.DEBUG) {
			throw new cw.UnitTest.SkipTest("Preventing the use of erroneous method names only works with DEBUG");
		}
	},

	function test_cannotNameMethodErroneousName(self) {
		var attachBadMethod1 = function() {
			cw.Class.subclass(cw.Test, '__TestBadMethodNames_Temporary').methods(
				function crypto(){

				}
			);
		}

		var attachBadMethod2 = function() {
			cw.Class.subclass(cw.Test, '__TestBadMethodNames2_Temporary').methods(
				function onbeforeprint(){

				}
			);
		}

		self.assertThrows(Error, attachBadMethod1);
		self.assertThrows(Error, attachBadMethod2);
	}
);


/**
 * Test that naming a method something that might be a global object property
 * (like `window` or `cw`) is illegal with DEBUG
 *
 * (Test with .pmethods())
 */
cw.Test.TestObject._WithTemporary.subclass(cw.Test.TestObject, 'TestPmethodsIsLenient').methods(
	function setUp(self) {
		if(!goog.DEBUG) {
			throw new cw.UnitTest.SkipTest("Preventing the use of erroneous method names only works with DEBUG");
		}
	},

	function test_cannotNameMethodErroneousName(self) {
		var attachBadMethod1 = function() {
			cw.Test.__TestBadMethodNames_Temporary.pmethods({window: function(){}});
		}

		var attachBadMethod2 = function() {
			cw.Test.__TestBadMethodNames_Temporary.pmethods({cw: function(){}});
		}

		cw.Class.subclass(cw.Test, '__TestBadMethodNames_Temporary');

		attachBadMethod1();
		attachBadMethod2();
	}
);

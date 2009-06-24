/**
 * Tests for the Divmod object model.
 */


// import Divmod.UnitTest


Divmod.UnitTest.TestCase.subclass(Divmod.Test.TestObject, 'TestObject').methods(

	function test_class(self) {
		var Eater = Divmod.Class.subclass('Eater');

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
				BetterEater.upcall(self, "__init__", foodFactory);
				self.food += 10;
			});

		var makeFood = function() {
			return 100;
		};

		var be = new BetterEater(makeFood);

		Eater.classIncr();
		Eater.classIncr();
		Eater.classIncr();

		// if attribute-copying 'polymorphism' is in Divmod.Class.subclass
//		BetterEater.classIncr();
//		BetterEater.classIncr();
		// endif

		// if attribute-copying removed in Divmod.Class.subclass
		self.assertIdentical(undefined, BetterEater.classIncr);
		// endif

		self.assert(be.doEat() == 111, "explode");

		self.assert(Eater.classCounter == 3, 'classmethod fuckup');

		// if attribute-copying 'polymorphism' is in Divmod.Class.subclass
//		self.assert(BetterEater.classCounter == 2, 'classmethod fuckup');
		// endif

		// if attribute-copying removed in Divmod.Class.subclass
		self.assertIdentical(undefined, BetterEater.classCounter);
		// endif
	},


	/**
	 * Using the 2-parameter subclass method creates a subclass and adds the
	 * subclass name to the global namespace.
	 */
	function test_twoParamSubclass(self) {
		var cls = Divmod.Class.subclass(Divmod.Test.TestObject, 'InheritTest');
		try {
			self.assertIdentical(Divmod.Test.TestObject.InheritTest, cls);
			self.assertIdentical(cls.__name__, 'Divmod.Test.TestObject.InheritTest');
		} finally {
			delete Divmod.Test.TestObject.InheritTest;
		}
	},


	/**
	 * Modules have a __name__ attribute which gives their name.
	 */
	function test_moduleName(self) {
		var mod = Divmod.Test.TestObject;
		self.assertIdentical(mod.__name__, 'Divmod.Test.TestObject');
	},


	/**
	 * Test that Divmod.Class subclasses have a __name__ attribute which gives
	 * their name.
	 */
	function test_className(self) {
		var cls = Divmod.Class.subclass("test_object.test_className.cls");
		self.assertIdentical(cls.__name__, "test_object.test_className.cls");

		/* Make sure subclasses don't inherit __name__ from their superclass.
		 */
		var subcls = cls.subclass("test_object.test_className.subcls");
		self.assertIdentical(subcls.__name__, "test_object.test_className.subcls");
	},


	/**
	 * Test that instances of Divmod.Class have a __class__ attribute which refers
	 * to their class.
	 */
	function test_instanceClassReference(self) {
		var cls = Divmod.Class.subclass("test_object.test_instanceClassReference.cls");
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
	 * Calling C{toString} on a L{Divmod.Class} should return something
	 * informative.
	 */
	function test_classToString(self) {
		var cls = Divmod.Class.subclass('test_classToString');
		self.assertIdentical(cls.toString(), '<Class test_classToString>');
	},


	/**
	 * Calling C{toString} on a L{Divmod.Class} instance should return
	 * something informative.
	 */
	function test_instanceToString(self) {
		var cls = Divmod.Class.subclass('test_instanceToString');
		self.assertIdentical(
			cls().toString(), '<"Instance" of test_instanceToString>');
	},


	/**
	 * Like L{test_classToString}, but for unnamed L{Divmod.Class} subclasses.
	 */
	function test_unnamedClassToString(self) {
		var cls = Divmod.Class.subclass();
		var classDebugCounter = Divmod.__classDebugCounter__;
		self.assertIdentical(
			cls.toString(), '<Class #' + classDebugCounter + '>');
	},


	/**
	 * Like L{test_instanceToString} but for instances of unnamed
	 * L{Divmod.Class} subclasses.
	 */
	function test_unnamedInstanceToString(self) {
		var cls = Divmod.Class.subclass();
		var classDebugCounter = Divmod.__classDebugCounter__;
		self.assertIdentical(
			cls().toString(),
			'<"Instance" of #' + classDebugCounter + '>');
	},


	/**
	 * Test that L{Divmod.__instanceCounter__} is not incremented when a new
	 * *class* is created.
	 */
	function test_instanceCounterNoInstances(self) {
		var instanceCounter = Divmod.__instanceCounter__;
		var cls = Divmod.Class.subclass('test_instanceCounterNoInstances');
		self.assertIdentical(
			Divmod.__instanceCounter__,
			instanceCounter);
	},


	/**
	 * Test that L{Divmod.__instanceCounter__} is incremented when a class is
	 * instantiated.
	 */
	function test_instanceCounterIncremented(self) {
		var cls = Divmod.Class.subclass('test_instanceCounterIncremented');
		var instanceCounter = Divmod.__instanceCounter__;
		cls();
		self.assertIdentical(
			Divmod.__instanceCounter__, instanceCounter + 1);
		cls();
		self.assertIdentical(
			Divmod.__instanceCounter__, instanceCounter + 2);
	},


	/**
	 * Like L{test_instanceCounterIncremented}, but using the C{new} statement
	 * to instantiate classes.
	 */
	function test_instanceCounterIncrementedNew(self) {
		var cls = Divmod.Class.subclass('test_instanceCounterIncremented');
		var instanceCounter = Divmod.__instanceCounter__;
		new cls();
		self.assertIdentical(
			Divmod.__instanceCounter__, instanceCounter + 1);
		new cls();
		self.assertIdentical(
			Divmod.__instanceCounter__, instanceCounter + 2);
	},


	/**
	 * Verify that the C{__id__} attribute is not the same for two instances
	 * of the same L{Divmod.Class}.
	 */
	function test_uniqueID(self) {
		var cls = Divmod.Class.subclass('test_uniqueID');
		if(cls().__id__ === cls().__id__) {
			self.fail('__id__ attribute not unique');
		}
	},


	function test_newlessInstantiation(self) {
		/*
		 * Test that Divmod.Class subclasses can be instantiated without using
		 * `new', as well as using .apply() and .call().
		 */
		var SomeClass = Divmod.Class.subclass("SomeClass");
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


//	function test_namedAny(self) {
//		self.assert(Divmod.namedAny('not.a.real.package.or.name') == undefined);
//		self.assert(Divmod.namedAny('Divmod') == Divmod);
//		self.assert(Divmod.namedAny('Divmod.namedAny') == Divmod.namedAny);
//
//		var path = [];
//		self.assert(Divmod.namedAny('Divmod', path) == Divmod);
//		self.assert(path.length == 0);
//
//		self.assert(Divmod.namedAny('Divmod.namedAny', path) == Divmod.namedAny);
//		self.assert(path.length == 1);
//		self.assert(path[0] == Divmod);
//	},


//	/**
//	 * Test that L{Divmod.objectify} properly zips two lists into an object with
//	 * properties from the first list bound to the objects from the second.
//	 */
//	function test_objectify(self) {
//		var keys = ["one", "two", "red", "blue"];
//		var values = [1, 2, [255, 0, 0], [0, 0, 255]];
//		var obj = Divmod.objectify(keys, values);
//		self.assertIdentical(obj.one, 1);
//		self.assertIdentical(obj.two, 2);
//		self.assertArraysEqual(obj.red, [255, 0, 0]);
//		self.assertArraysEqual(obj.blue, [0, 0, 255]);
//
//		/*
//		 * Test that it fails loudly on invalid input, too.
//		 */
//		var msg = "Lengths of keys and values must be the same.";
//		var error;
//
//		error = self.assertThrows(Error, function() { Divmod.objectify([], ["foo"]); });
//		self.assert(Divmod.startswith(error.message, msg));
//
//		error = self.assertThrows(Error, function() { Divmod.objectify(["foo"], []); });
//		self.assert(Divmod.startswith(error.message, msg));
//	},


	function test_method(self) {
		var MethodClassTest = Divmod.Class.subclass('MethodClassTest');

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
	},


	function test_logger(self) {
		// calling this now will remove any erroneous log observers, allowing
		// the test below to behave deterministically.
		Divmod.msg('flushing log');

		var logEvents = [];

		var removeObserver = Divmod.logger.addObserver(
			function(event) { logEvents.push(event); });

		var logmsg = "(logging system test error) Hello, world";
		Divmod.msg(logmsg);

		self.assertIdentical(1, logEvents.length);
		self.assertIdentical(false, logEvents[0].isError);
		self.assertIdentical(logmsg, logEvents[0].message);

		logEvents = [];

		var logerr = "(logging system test error) Doom, world.";
		Divmod.err(new Error(logerr), logmsg);

		self.assertIdentical(1, logEvents.length);
		self.assertIdentical(true, logEvents[0].isError);
		self.assertIdentical(true, logEvents[0].error instanceof Error);
		self.assert(Divmod.startswith(logEvents[0].error.message, logerr));
		self.assertIdentical(logmsg, logEvents[0].message);

		removeObserver();
		logEvents = [];
		Divmod.msg(logmsg);
		self.assertIdentical(0, logEvents.length);

		var observererr = "(logging system test error) Observer had a bug.";
		Divmod.logger.addObserver(function(event) { throw new Error(observererr); });
		Divmod.logger.addObserver(function(event) { logEvents.push(event); });

		Divmod.msg(logmsg);
		Divmod.msg(logerr);
		self.assertIdentical(3, logEvents.length, "Incorrect number of events logged");
		self.assertIdentical(false, logEvents[0].isError, "First event should not have been an error");
		self.assertIdentical(logmsg, logEvents[0].message, "First event had wrong message");
		self.assertIdentical(true, logEvents[1].isError, "Second event should have been an error");
		self.assertIdentical(observererr, logEvents[1].error.message, "Second event had wrong message");
		self.assertIdentical(false, logEvents[2].isError, "Third event should not have been an error");
		self.assertIdentical(logerr, logEvents[2].message, "Third event had wrong message");

	}
);




Divmod.UnitTest.TestCase.subclass(Divmod.Test.TestObject, 'TestBareObject').methods(

	/*
	 * Verify that method/methods-free classes (prototype. only) work fine.
	 */
	function test_bareClass(self) {
		var Bare = Divmod.Class.subclass('Bare');

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

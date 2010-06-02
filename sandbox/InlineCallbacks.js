// import CW
// import CW.Defer

// Note: `CW' is functionally equivalent to `Divmod', at least for this file.

// JavaScript 1.7 only works inside a
// <script type="application/javascript;version=1.7">

goog.require('goog.debug.Error');

CW.InlineCallbacks.yTest = function() {
	yield 4;
	yield 8;
};


/* TODO: untested since CW.Error removal */
CW.InlineCallbacks._DefGen_Return = function(value) {
	goog.debug.Error.call(this);
	this.value = value;
	this.message = "If you see this in user code, maybe the function isn't a generator.";
};
goog.inherits(CW.InlineCallbacks._DefGen_Return, goog.debug.Error);
CW.InlineCallbacks._DefGen_Return.prototype.name = 'CW.InlineCallbacks._DefGen_Return';


/*
	Return val from a L{inlineCallbacks} generator.

	Note: this is currently implemented by raising an exception
	derived from goog.debug.Error.  You might need to change 'catch'
	clauses to re-throw _DefGen_Return

	Also: while this function currently will work when called from
	within arbitrary functions called from within the generator, do
	not rely upon this behavior.
*/

CW.InlineCallbacks.returnValue = function(val) {
	throw new CW.InlineCallbacks._DefGen_Return(val);
};



/*
	See L{inlineCallbacks}.
*/
CW.InlineCallbacks._inlineCallbacks = function(result, g, deferred) {

	// This function is complicated by the need to prevent unbounded recursion
	// arising from repeatedly yielding immediately ready deferreds.  This while
	// loop and the waiting variable solve that by manually unfolding the
	// recursion.

	var waiting = [true, // waiting for result?
					undefined] // result

	while(1) {
		try {
			// Send the last result back as the result of the yield expression.
			if(result instanceof CW.Defer.Failure) {
				result = g.throw(result.error);
			} else {
				result = g.send(result);
			}
		} catch(e if e instanceof StopIteration) {
			// fell off the end, or "return" statement
			deferred.callback(undefined);
			return deferred;
		} catch(e if e instanceof CW.InlineCallbacks._DefGen_Return) {
			// returnValue call
			deferred.callback(e.value);
			return deferred;
		} catch(e) {
			// Unlike the Python version, we have to pass in the e here.
			deferred.errback(e);
			return deferred;
		}

		if(result instanceof CW.Defer.Deferred) {
			// a deferred was yielded, get the result.
			var gotResult = function(r) {
				if(waiting[0]) {
					waiting[0] = false;
					waiting[1] = r;
				} else {
					CW.InlineCallbacks._inlineCallbacks(r, g, deferred);
				}
			}

			result.addBoth(gotResult);
			if(waiting[0]) {
				// Haven't called back yet, set flag so that we get reinvoked
				// and return from the loop
				waiting[0] = false;
				return deferred;
			}

			result = waiting[1];
			// Reset waiting to initial values for next loop.  gotResult uses
			// waiting, but this isn't a problem because gotResult is only
			// executed once, and if it hasn't been executed yet, the return
			// branch above would have been taken.


			waiting[0] = true;
			waiting[1] = undefined;
		}
	}

	return deferred;
};



/*
    inlineCallbacks helps you write Deferred-using code that looks like a
    regular sequential function. This function uses features of JavaScript 1.7
    generators.  For example::

	var thingummy = function() {
		var thing = yield makeSomeRequestResultingInDeferred();
		console.log(thing); // the result! hoorj!
	}
	thingummy = CW.InlineCallbacks.inlineCallbacks(thingummy);

    When you call anything that results in a Deferred, you can simply yield it;
    your generator will automatically be resumed when the Deferred's result is
    available. The generator will be sent the result of the Deferred with the
    'send' method on generators, or if the result was a failure, 'throw'.

    Your inlineCallbacks-enabled generator will return a Deferred object, which
    will result in the return value of the generator (or will fail with a
    failure object if your generator raises an unhandled exception). Note that
    you can't use 'return result' to return a value; use 'returnValue(result)'
    instead. Falling off the end of the generator, or simply using 'return'
    will cause the Deferred to have a result of `undefined'.

    The Deferred returned from your deferred generator may errback if your
    generator raised an exception::

	var thingummy = function() {
		var thing = yield makeSomeRequestResultingInDeferred();
		if(thing == 'I love Twisted') {
			// will become the result of the Deferred
			CW.InlineCallbacks.returnValue('TWISTED IS GREAT!');
		} else {
			// will trigger an errback
			throw new Error('DESTROY ALL LIFE');
		}
	}
	thingummy = CW.InlineCallbacks.inlineCallbacks(thingummy);
*/
CW.InlineCallbacks.inlineCallbacks = function(f) {
	var unwindGenerator = function() {
		var generator = f.apply(this, arguments);
		return CW.InlineCallbacks._inlineCallbacks(
			undefined, generator, CW.Defer.Deferred());
	}
	return unwindGenerator;
};



// Original Python code follows


/*


class _DefGen_Return(BaseException):
    def __init__(self, value):
        self.value = value

def returnValue(val):
    """
    Return val from a L{inlineCallbacks} generator.

    Note: this is currently implemented by raising an exception
    derived from BaseException.  You might want to change any
    'except:' clauses to an 'except Exception:' clause so as not to
    catch this exception.

    Also: while this function currently will work when called from
    within arbitrary functions called from within the generator, do
    not rely upon this behavior.
    """
    raise _DefGen_Return(val)

def _inlineCallbacks(result, g, deferred):
    """
    See L{inlineCallbacks}.
    """
    # This function is complicated by the need to prevent unbounded recursion
    # arising from repeatedly yielding immediately ready deferreds.  This while
    # loop and the waiting variable solve that by manually unfolding the
    # recursion.

    waiting = [True, # waiting for result?
               None] # result

    while 1:
        try:
            # Send the last result back as the result of the yield expression.
            if isinstance(result, failure.Failure):
                result = result.throwExceptionIntoGenerator(g)
            else:
                result = g.send(result)
        except StopIteration:
            # fell off the end, or "return" statement
            deferred.callback(None)
            return deferred
        except _DefGen_Return, e:
            # returnValue call
            deferred.callback(e.value)
            return deferred
        except:
            deferred.errback()
            return deferred

        if isinstance(result, Deferred):
            # a deferred was yielded, get the result.
            def gotResult(r):
                if waiting[0]:
                    waiting[0] = False
                    waiting[1] = r
                else:
                    _inlineCallbacks(r, g, deferred)

            result.addBoth(gotResult)
            if waiting[0]:
                # Haven't called back yet, set flag so that we get reinvoked
                # and return from the loop
                waiting[0] = False
                return deferred

            result = waiting[1]
            # Reset waiting to initial values for next loop.  gotResult uses
            # waiting, but this isn't a problem because gotResult is only
            # executed once, and if it hasn't been executed yet, the return
            # branch above would have been taken.


            waiting[0] = True
            waiting[1] = None


    return deferred

def inlineCallbacks(f):
    """
    inlineCallbacks helps you write Deferred-using code that looks like a
    regular sequential function. This function uses features of Python 2.5
    generators.  The older L{deferredGenerator} function accomplishes the
    same thing, but with somewhat more boilerplate.  For example::

        def thingummy():
            thing = yield makeSomeRequestResultingInDeferred()
            print thing #the result! hoorj!
        thingummy = inlineCallbacks(thingummy)

    When you call anything that results in a Deferred, you can simply yield it;
    your generator will automatically be resumed when the Deferred's result is
    available. The generator will be sent the result of the Deferred with the
    'send' method on generators, or if the result was a failure, 'throw'.

    Your inlineCallbacks-enabled generator will return a Deferred object, which
    will result in the return value of the generator (or will fail with a
    failure object if your generator raises an unhandled exception). Note that
    you can't use 'return result' to return a value; use 'returnValue(result)'
    instead. Falling off the end of the generator, or simply using 'return'
    will cause the Deferred to have a result of None.

    The Deferred returned from your deferred generator may errback if your
    generator raised an exception::

        def thingummy():
            thing = yield makeSomeRequestResultingInDeferred()
            if thing == 'I love Twisted':
                # will become the result of the Deferred
                returnValue('TWISTED IS GREAT!')
            else:
                # will trigger an errback
                raise Exception('DESTROY ALL LIFE')
        thingummy = inlineCallbacks(thingummy)
    """
    def unwindGenerator(*args, **kwargs):
        return _inlineCallbacks(None, f(*args, **kwargs), Deferred())
    return mergeFunctionMetadata(f, unwindGenerator)


*/

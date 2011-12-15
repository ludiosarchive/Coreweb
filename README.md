Coreweb overview
================

Coreweb is an assortment of JavaScript tools used by [Minerva](http://ludios.org/minerva/).

In [js_coreweb/cw/](https://github.com/ludios/Coreweb/tree/master/js_coreweb/cw) you'll find:

*	cw/unittest.js - JavaScript unit testing framework with Deferred
	support, inspired by [Twisted Trial](http://twistedmatrix.com/trac/wiki/TwistedTrial).

*	cw/repr.js - Provides `cw.repr.repr`, a Python-like `repr` with
	support for `__repr__` and an optimized variant `__reprPush__`
	that avoids copying strings.  cw/repr.js handles circular references.

*	cw/eq.js - Provides `cw.eq.equals`, which can deep-compare objects
	using its own comparisons and the `equals` method on your objects.
	See its docstring for the exact behavior.

*	cw/eventual.js - Provides a `setTimeout(..., 0)` that guarantees
	first-queued-first-called ordering.  This is a port of
	[Foolscap's eventual](http://foolscap.lothar.com/docs/api/foolscap.eventual-pysrc.html).

*	cw/crosstab.js - Makes it possible to do synchronous funcalls
	across already-open browser tabs (or windows), using
	`window.name`/`window.open`.  It doesn't work in Chrome or IE8+.

*	cw/env.js - Provides functions to grab information about the browser
	environment: plugins, window properties, screen information, time zone.

*	cw/externalinterface.js - A JS->Flash ExternalInterface that is
	fast and not broken (unlike what Flash Player injects into the page).

*	cw/loadflash.js - Functions to load a Flash object that follows
	our own `onloadcallback` protocol.  Returns a Deferred that fires
	when loading has finished.

*	cw/clock.js - Provides a deterministic clock for unit testing,
	roughly equivalent to `twisted.internet.task.Clock` but with
	`setTimeout` and `setInterval` methods.

*	cw/string.js - String utilities, some inspired by Python.

*	cw/deferred.js - Provides `cw.deferred.maybeDeferred`.

*	cw/objsize.js - Provides a function to guess how much memory
	an object is using.

*	cw/math.js - Provides special numbers.

*	cw/func.js - Provides `cw.func.isCallable`, which returns the right
	result even when called on IE's cross-window object proxies.

*	cw/linkify.js - A copy of Ben Alman's [js-linkify](http://benalman.com/code/test/js-linkify/).

*	Tests for the above, in [js_coreweb/cw/Test/](https://github.com/ludios/Coreweb/tree/master/js_coreweb/cw/Test).

Coreweb also includes a set of test pages and browser experiments in
[coreweb/exp/](https://github.com/ludios/Coreweb/tree/master/coreweb/exp).  The
convenient way to run these is to start the `coreweb_site` server (see below).



Use with Closure Library
========================

If you want to use Coreweb in your JavaScript project, all you need is:

*	Closure Library: http://code.google.com/intl/en/closure/library/

For uncompiled development, include `js_coreweb` as a sibling directory to
`closure-library` on your filesystem or web server.  If you make modifications
to files in `js_coreweb`, remember to run `./build_depsjs.sh` if necessary.

For compilation with Closure Compiler using closurebuilder, include
`js_coreweb` as an additional `--root=`.



Running the tests
=================

Right now, Coreweb requires using its built-in web server to run the tests.
You'll need to install:

*	Twisted: http://twistedmatrix.com/

*	Webmagic: https://github.com/ludios/Webmagic

*	Closure Library: http://code.google.com/intl/en/closure/library/

Note that Twisted and Webmagic can be installed using `pip`.

To start the server, run:

`twistd -n coreweb_site -t tcp:9090:interface=127.0.0.1 --closure-library=/abspath/closure-library`

or on Windows:

```
set PYTHONPATH=C:\Coreweb's_parent_directory (if not already in PYTHONPATH)
C:\Python27\python.exe C:\Python27\Scripts\twistd.py -n coreweb_site -t tcp:9090:interface=127.0.0.1 --closure-library=C:\abspath\closure-library
```

Note that if `closure-library` is in the parent of the source directory,
you can omit `--closure-library=`.

Then, navigate to `http://127.0.0.1:9090/` in your browser.



Recompiling the compiled .js and .swf files
===========================================

If you want to recompile the compiled-JavaScript and .swf files, you also need:

*	Closure Compiler: http://code.google.com/p/closure-compiler/

*	haXe: http://haxe.org/

Then run:

```
./build_compiled_js.sh
./build_swfs.sh
```



Limited project scope
=====================

Why the separation between Coreweb and Minerva?  Coreweb should contain
JavaScript and haXe files that assist in building web applications, but do not
rely on any server-side technology.

An example: client-side code to synchronize the client's clock with a server
should not be here, because that requires a custom-built server.



Contributing
============

Patches and pull requests are welcome.

This coding standard applies: http://ludios.org/coding-standard/

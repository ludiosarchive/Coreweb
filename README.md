Coreweb overview
================

[TODO]



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

Note that if `closure-library` is in the parent of the current directory
(`../closure-library`), you can omit `--closure-library=`.

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

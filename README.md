Requirements
============

If you want to use Coreweb in your JavaScript project, all you need is:

*	Closure Library: http://code.google.com/intl/en/closure/library/


If you want to run Coreweb's test suite using the included server
(coreweb_site), you also need:

*	Twisted: http://twistedmatrix.com/

*	Webmagic: https://github.com/ludios/Webmagic

*	Closure Library: http://code.google.com/intl/en/closure/library/


If you want to recompile the compiled-JavaScript and .swf files, you also need:

*	Closure Compiler: http://code.google.com/p/closure-compiler/

*	haXe: http://haxe.org/



Limited project scope
=====================

Why the separation between Coreweb and Minerva?  Coreweb should contain
JavaScript and haXe files that assist in building web applications, but do not
rely on any server-side technology.

An example: client-side code to synchronize the client's clock with a server
should not be here, because that requires a custom-built server.

=== Setting up JSPATH for development ===

1)	Create a directory "JSPATH" somewhere.

2)	Create symlinks like this:

	JSPATH/closure/goog -> ~/Projects/closure-library/closure/goog
	JSPATH/third_party -> ~/Projects/closure-library/third_party

	JSPATH/_Compilables.js -> ~/Projects/Coreweb/js/_Compilables.js
	JSPATH/cw/*.js -> ~/Projects/Coreweb/js/cw/*.js
		(yes, you may have to manully add a new symlink often)
	JSPATH/cw/Test -> ~/Projects/Coreweb/js/cw/Test

	And if you have these projects:

	JSPATH/cw/lytics -> ~/Projects/Minerva/js/cw/lytics
	JSPATH/cw/net -> ~/Projects/Minerva/js/cw/net

3)	Copy the regen-deps.sh and auto-regen-deps.sh scripts from
	~/docs/ to your JSPATH root. Modify them as necessary to match
	your filesystem and projects.

4)	Run ./auto-regen-deps.sh
	This will automatically regenerate the nongoog_deps.js file when
	any of your JavaScript source files change.


=== Limited project scope ===

Coreweb should contain JavaScript and Flash (haXe/AS3) files that assist in
building web applications, but are not related to any server-side technology.

For example, client-side Comet code should not be here, because Comet (as of 2009)
requires a custom-built (and unstandardized) server.

Another example: client-side code to synchronize the client's clock with a server
should not be here, because that requires a custom-built server.

The JavaScript code in Coreweb should not rely on complex server-side functionality,
except for testing client-side code.

Nothing here relies on special server code, so cwtools/testres/ contains only static
files, which are expected to be served at /@testres_CW/


=== Browser-environment testing ===

Start the web server, navigate to its /@tests/ page.
TODO: write more

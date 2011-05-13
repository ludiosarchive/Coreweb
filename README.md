=== Limited project scope ===

Coreweb should contain JavaScript and Flash (haXe/AS3) files that assist in
building web applications, but are not related to any server-side technology.

For example, client-side Comet code should not be here, because Comet (as of 2009)
requires a custom-built (and unstandardized) server.

Another example: client-side code to synchronize the client's clock with a server
should not be here, because that requires a custom-built server.

The JavaScript code in Coreweb should not rely on complex server-side functionality,
except for testing client-side code.

Nothing here relies on special server code, so coreweb/testres/ contains only static
files, which are expected to be served at /@testres_CW/


=== Browser-environment testing ===

Start the web server, navigate to its /@tests/ page.
TODO: write more

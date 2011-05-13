Limited project scope
=====================

Why the separation between Coreweb and Minerva?  Coreweb should contain
JavaScript and haXe files that assist in building web applications, but do not
rely on any server-side technology.

An example: client-side code to synchronize the client's clock with a server
should not be here, because that requires a custom-built server.

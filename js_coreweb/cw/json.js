goog.provide('cw.json');

goog.require('goog.json');


/**
 * If goog.json.serialize stops serializing to ASCII by default (perhaps
 * due to a switch to JSON.stringify), we'll change this to our own
 * ASCII-only serializer.
 *
 * See https://groups.google.com/group/closure-library-discuss/t/1a7c5418ffafad8f
 */
cw.json.asciify = goog.json.serialize;


/**
 * Alias .parse here too, for convenience.
 */
cw.json.parse = goog.json.parse;

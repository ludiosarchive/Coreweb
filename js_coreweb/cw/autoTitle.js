/**
 * @fileoverview Automatically set the page's <title> to a
 * 	reasonably-descriptive title.
 */

goog.provide('cw.autoTitle');


cw.autoTitle.setTitle = function() {
	var split = String(document.location).split('/');
	var last = split[split.length-1];
	var almostLast = split[split.length-2];

	var scheme = String(document.location).split(':')[0].replace('https', '(S)').replace('http', '(H)').replace('file', '(F)');
	if(last) {
		document.title = last + ' ' + scheme;
	} else {
		document.title = almostLast + ' ' + scheme;
	}
};

cw.autoTitle.setTitle();

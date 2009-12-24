/**
 * Automatically set the page's <title> to a reasonably-descriptive title.
 */

(function(){
	var split = (''+document.location).split('/');
	var last = split[split.length-1];
	var almostLast = split[split.length-2];

	var scheme = (''+document.location).split(':')[0].replace('https', '(S)').replace('http', '(H)').replace('file', '(F)');
	if(last) {
		document.title = last + ' ' + scheme;
	} else {
		document.title = almostLast + ' ' + scheme;
	}
})();

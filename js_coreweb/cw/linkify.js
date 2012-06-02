/**
 * @license
 * linkify - v0.3 - 6/27/2009
 * http://benalman.com/code/test/js-linkify/
 *
 * Copyright (c) 2009 "Cowboy" Ben Alman
 * Licensed under the MIT license
 * http://benalman.com/about/license/
 *
 * Some regexps adapted from http://userscripts.org/scripts/review/7122
 */

goog.provide('cw.linkify');



cw.linkify.SCHEME_ = "[a-z\\d.-]+://",
cw.linkify.IPV4_ =
	"(?:(?:[0-9]|[1-9]\\d|1\\d{2}|2[0-4]\\d|25[0-5])\\.)" +
	"{3}(?:[0-9]|[1-9]\\d|1\\d{2}|2[0-4]\\d|25[0-5])",
cw.linkify.HOSTNAME_ = "(?:(?:[^\\s!@#$%^&*()_=+[\\]{}\\\\|;:'\",.<>/?]+)\\.)+",
cw.linkify.TLD_ =
	"(?:ac|ad|aero|ae|af|ag|ai|al|am|an|ao|aq|arpa|ar|asia|as|" +
	"at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|biz|bi|bj|bm|bn|bo|br|" +
	"bs|bt|bv|bw|by|bz|cat|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|" +
	"coop|com|co|cr|cu|cv|cx|cy|cz|de|dj|dk|dm|do|dz|ec|edu|" +
	"ee|eg|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|" +
	"gi|gl|gm|gn|gov|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|" +
	"ht|hu|id|ie|il|im|info|int|in|io|iq|ir|is|it|je|jm|jobs|jo|" +
	"jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|" +
	"lt|lu|lv|ly|ma|mc|md|me|mg|mh|mil|mk|ml|mm|mn|mobi|mo|" +
	"mp|mq|mr|ms|mt|museum|mu|mv|mw|mx|my|mz|name|na|" +
	"nc|net|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|org|pa|pe|pf|pg|" +
	"ph|pk|pl|pm|pn|pro|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|" +
	"sc|sd|se|sg|sh|si|sj|sk|sl|sm|sn|so|sr|st|su|sv|sy|sz|tc|" +
	"td|tel|tf|tg|th|tj|tk|tl|tm|tn|to|tp|travel|tr|tt|tv|tw|" +
	"tz|ua|ug|uk|um|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|" +
	"xn--0zwm56d|xn--11b5bs3a9aj6g|xn--80akhbyknj4f|" +
	"xn--9t4b11yi5a|xn--deba0ad|xn--g6w251d|xn--hgbk6aj7f53bba|" +
	"xn--hlcj6aya9esc7a|xn--jxalpdlp|xn--kgbechtv|xn--zckzah|" +
	"ye|yt|yu|za|zm|zw)",
cw.linkify.HOST_OR_IP_ = "(?:" + cw.linkify.HOSTNAME_ + cw.linkify.TLD_ + "|" + cw.linkify.IPV4_ + ")",
cw.linkify.PATH_ = "(?:[;/][^#?<>\\s]*)?",
cw.linkify.QUERY_FRAG_ = "(?:\\?[^#<>\\s]*)?(?:#[^<>\\s]*)?",
cw.linkify.URI1_ = "\\b" + cw.linkify.SCHEME_ + "[^<>\\s]+",
cw.linkify.URI2_ = "\\b" + cw.linkify.HOST_OR_IP_ + cw.linkify.PATH_ + cw.linkify.QUERY_FRAG_ + "(?!\\w)",

cw.linkify.MAILTO_ = "mailto:",
cw.linkify.EMAIL_ = "(?:" + cw.linkify.MAILTO_ +
	")?[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@" +
	cw.linkify.HOST_OR_IP_ + cw.linkify.QUERY_FRAG_ + "(?!\\w)",

cw.linkify.URI_RE_ = new RegExp("(?:" + cw.linkify.URI1_ + "|" + cw.linkify.URI2_ + "|" + cw.linkify.EMAIL_ + ")", "ig"),
cw.linkify.SCHEME_RE_ = new RegExp("^" + cw.linkify.SCHEME_, "i"),

cw.linkify.quotes_ = {
	"'": "`",
	'>': '<',
	')': '(',
	']': '[',
	'}': '{',
	'»': '«',
	'›': '‹'
},

cw.linkify.defaultOptions_ = {
	callback: function(text, href) {
		return href ? '<a href="' + href + '" title="' + href + '">' + text + '<\/a>' : text;
	},
	punct_regexp: /(?:[!?.,:;'"]|(?:&|&amp;)(?:lt|gt|quot|apos|raquo|laquo|rsaquo|lsaquo);)$/
};



/**
 * Turn text into linkified html.
 *
 * var html = cw.linkify.linkify(text, options);
 *
 * Options:
 *
 *  callback (Function) - default: undefined - if defined, this will be called
 *    for each link- or non-link-chunk with two arguments, text and href.  If the
 *    chunk is non-link, href will be omitted.
 *
 *  punct_regexp (RegExp | Boolean) - a RegExp that can be used to trim trailing
 *    punctuation from links, instead of the default.
 *
 * This is a work in progress, please let me know if (and how) it fails!
 *
 * @param {string} text
 * @param {!Object=} options
 * @return {string}
 */
cw.linkify.linkify = function(text, options) {
	options = options || {};

	var parts = [];
	var idx_prev;

	// Initialize options.
	for(var i in cw.linkify.defaultOptions_) {
		if(!goog.isDef(options[i])) {
			options[i] = cw.linkify.defaultOptions_[i];
		}
	}

	// Find links.
	var arr;
	while(arr = cw.linkify.URI_RE_.exec(text)) {
		var link = arr[0];
		var idx_last = cw.linkify.URI_RE_.lastIndex;
		var idx = idx_last - link.length;

		// Not a link if preceded by certain characters.
		if (/[\/:]/.test(text.charAt(idx - 1))) {
			continue;
		}

		// Trim trailing punctuation.
		do {
			// If no changes are made, we don't want to loop forever!
			var link_last = link;

			var quote_end = link.substr(-1)
			var quote_begin = cw.linkify.quotes_[quote_end];

			// Ending quote character?
			if(quote_begin) {
				var matches_begin = link.match(new RegExp('\\' + quote_begin + '(?!$)', 'g'));
				var matches_end = link.match(new RegExp('\\' + quote_end, 'g'));

				// If quotes are unbalanced, remove trailing quote character.
				if((matches_begin ? matches_begin.length : 0) <
				(matches_end ? matches_end.length : 0)) {
					link = link.substr(0, link.length - 1);
					idx_last--;
				}
			}

			// Ending non-quote punctuation character?
			if(options.punct_regexp) {
				link = link.replace(options.punct_regexp, function(a) {
					idx_last -= a.length;
					return '';
				});
			}
		} while(link.length && link !== link_last);

		var href = link;

		// Add appropriate protocol to naked links.
		if(!cw.linkify.SCHEME_RE_.test(href)) {
			href = (
				href.indexOf('@') !== -1 ?
					(!href.indexOf(cw.linkify.MAILTO_) ? ''
					: cw.linkify.MAILTO_)
				: !href.indexOf('irc.') ? 'irc://'
				: !href.indexOf('ftp.') ? 'ftp://'
				: 'http://')
				+ href;
		}

		// Push preceding non-link text onto the array.
		if(idx_prev != idx) {
			parts.push([text.slice(idx_prev, idx)]);
			idx_prev = idx_last;
		}

		// Push massaged link onto the array
		parts.push([link, href]);
	};

	// Push remaining non-link text onto the array.
	parts.push([text.substr(idx_prev)]);

	var html = "";
	// Process the array items.
	for (i = 0; i < parts.length; i++) {
		// TODO: don't use +=
		html += options.callback.apply(goog.global, parts[i]);
	}

	// In case of catastrophic failure, return the original text;
	return html || text;
};

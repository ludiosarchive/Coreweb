goog.provide('cw.whoami');

goog.require('goog.net.cookies');


/**
 * Get the uaId from the cookie. If not set, returns undefined.
 *
 * @return {string|undefined} the uaId
 */
cw.whoami.getUaId = function() {
	var isHttps = window.location.protocol == 'https:';
	var cookieName = isHttps ? '_s' : '__';

	var uaId = goog.net.cookies.get(cookieName);

	return uaId;
};

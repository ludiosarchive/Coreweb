goog.provide('cw.whoami');

goog.require('goog.net.cookies');


/**
 * @const
 * @type {string}
 */
cw.whoami.HTTP_COOKIE_NAME = '__';


/**
 * @const
 * @type {string}
 */
cw.whoami.HTTPS_COOKIE_NAME = '_s';


/**
 * Get the uaId from the cookie. If not set, returns null.
 *
 * @return {?string} the uaId
 */
cw.whoami.getUaId = function() {
	var isHttps = window.location.protocol == 'https:';
	var cookieName = (isHttps ? cw.whoami.HTTPS_COOKIE_NAME :
		cw.whoami.HTTP_COOKIE_NAME);

	return goog.net.cookies.get(cookieName, null);
};

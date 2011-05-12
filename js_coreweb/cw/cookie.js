goog.provide('cw.cookie');

goog.require('goog.net.cookies');


/**
 * Returns the value of cookie {@code httpsName} if the current page was
 * loaded over HTTPS, or the value of cookie {@code httpName} otherwise.
 *
 * @param {string} httpName The name of the HTTP cookie.
 * @param {string} httpsName The name of the HTTPS cookie.
 *
 * @return {?string} the cookie value.
 */
cw.cookie.getHttpOrHttpsCookie = function(httpName, httpsName) {
	var isHttps = window.location.protocol == 'https:';
	var cookieName = isHttps ? httpsName : httpName;

	var value = goog.net.cookies.get(cookieName);
	return goog.isDef(value) ? value : null;
};

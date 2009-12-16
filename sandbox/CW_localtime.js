
/**
 * Date tools.
 *
 * This is useful because each browser has a different idea of what a
 * coerced-to-string date should look like.
 *
 * TODO: maybe support for UTC as well as local time?
 */

/**
 * Return a date that looks like an ISO formatted one, except format
 * the tz in decimal hours, not HHMM offset.
 */
CW.localTime = function localTime() {
	function pad2(s) {
		return ('00' + s).slice(-2)
	}

	var time = new Date;
	var day = time.getFullYear() + '-' + pad2(time.getMonth() + 1) + '-' + pad2(time.getDate());

	var clock =
		pad2(time.getHours()) + ':' +
		pad2(time.getMinutes()) + ':' +
		pad2(time.getSeconds()) + '.' +
		('000' + time.getMilliseconds()).slice(-3);

	var tz = time.getTimezoneOffset() / 60;

	return day + ' ' + clock + ' -' + tz;
};

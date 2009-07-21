/**
 * Date tools.
 *
 * This is useful because each browser has a different idea of what a
 * coerced-to-string date should look like.
 *
 * TODO: maybe support for UTC as well as local time?
 */

// import CW

CW.ISODate.leftPad = function(string, num) {
	return new Array(num - string.length + 1).join('0') + string;
};

/**
 * Return a date that looks sort of like an ISO formatted one.
 */
CW.ISODate.localTime = function() {
	function p2(s) {
		return CW.ISODate.leftPad(''+s, 2);
	}

	var time = new Date;
	var day = time.getFullYear() + '-' + p2(time.getMonth() + 1) + '-' + p2(time.getDate());

	var clock =
		p2(time.getHours()) + ':' +
		p2(time.getMinutes()) + ':' +
		p2(time.getSeconds()) + '.' +
		CW.ISODate.leftPad(''+time.getMilliseconds(), 3);

	var tz = time.getTimezoneOffset()/60;

	return day + ' ' + clock + ' -' + tz;
};

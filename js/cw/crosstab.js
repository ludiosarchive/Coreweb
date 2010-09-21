/**
 * @fileoverview Utilities for sending information across already-open browser
 * 	tabs (or windows).
 */

/**
 * Notes:
 *
 * https://developer.mozilla.org/en/DOM/window.open
 * http://msdn.microsoft.com/en-us/library/ms536651%28VS.85%29.aspx
 *
 * (At least in FF) "You can test for the existence of the window object
 * reference which is the returned value in case of success of the window.open()
 * call and then verify that windowObjectReference.closed return value is false."
 *
 * "With the built-in popup blockers of Mozilla/Firefox and Internet Explorer 6 SP2,
 * you have to check the return value of window.open(): it will be null if the
 * window wasn't allowed to open. However, for most other popup blockers,
 * there is no reliable way."
 */

goog.provide('cw.crosstab');

goog.require('cw.string');
goog.require('goog.array');
goog.require('goog.events');
goog.require('goog.events.EventTarget');
goog.require('goog.net.cookies');


/**
 * Event types.
 * @enum {string}
 */
cw.crosstab.EventType = {
	BECAME_SLAVE: goog.events.getUniqueId('became_slave'),
	BECAME_MASTER: goog.events.getUniqueId('became_master'),
	GOT_NEW_SLAVE: goog.events.getUniqueId('got_new_slave')
};


/**
 * CrossNamedWindow is safe to use only in browsers that load all pages in a
 * single process.  Do not use with Chrome or Chromium or IE8 or IE9.  Do not
 * use with Safari because window.open(...) switches tabs in Safari.
 *
 * @param {string} cookieName Name of the cookie that might contain the window
 * 	name of the master tab.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
cw.crosstab.CrossNamedWindow = function(cookieName) {
	goog.events.EventTarget.call(this);

	/**
	 * @type {string}
	 * @private
	 */
	this.cookieName_ = cookieName;

	/**
	 * @type {!Array.<cw.crosstab.CrossNamedWindow>}
	 */
	this.slaves_ = [];
};
goog.inherits(cw.crosstab.CrossNamedWindow, goog.events.EventTarget);

/**
 * A reference to the master, or null if I am the master.
 * @type {?Object}
 * @private
 */
cw.crosstab.CrossNamedWindow.prototype.master_ = null;

/**
 * @private
 */
cw.crosstab.CrossNamedWindow.prototype.setWindowName_ = function() {
	window.name = '_CNW_' + cw.string.getCleanRandomString() + cw.string.getCleanRandomString();
};

/**
 * @param {!cw.crosstab.CrossNamedWindow} slave
 */
cw.crosstab.CrossNamedWindow.prototype.addSlave = function(slave) {
	this.slaves_.push(slave);
};

/**
 * @param {!cw.crosstab.CrossNamedWindow} slave
 */
cw.crosstab.CrossNamedWindow.prototype.removeSlave = function(slave) {
	var ret = goog.array.remove(this.slaves_, slave);
	if(!ret) {
		throw Error("I didn't know about slave " + slave);
	}
};

/**
 * @private
 */
cw.crosstab.CrossNamedWindow.prototype.becomeMaster_ = function() {
	this.setWindowName_();
	this.master_ = null;
	this.dispatchEvent({
		type: cw.crosstab.EventType.BECAME_MASTER
	});
};

/**
 * @private
 */
cw.crosstab.CrossNamedWindow.prototype.becomeSlave_ = function(masterName) {
	var ret = window.open('', masterName,
		'height=1,width=1,location=0,menubar=0,scrollbars=0,' +
		'titlebar=0,toolbar=0,top=10000,left=10000');
	if(!ret || !ret['__theCrossNameWindow'] || ret.closed) {
		// TODO: close window we might have opened
		this.becomeMaster_();
	} else {
		this.master_ = ret;
		this.master_.addSlave(this);
		this.dispatchEvent({
			type: cw.crosstab.EventType.BECAME_SLAVE
		});
	}
};

/**
 *
 */
cw.crosstab.CrossNamedWindow.prototype.start = function() {
	var masterName = goog.net.cookies.get(this.cookieName_);
	if(!masterName) {
		this.becomeMaster_();
	} else {
		this.becomeSlave_(masterName);
	}
};

/**
 * @type {cw.crosstab.CrossNamedWindow}
 */
cw.crosstab.theCrossNamedWindow =
	new cw.crosstab.CrossNamedWindow('__CrossNamedWindow');

goog.global['__theCrossNamedWindow'] = cw.crosstab.theCrossNamedWindow;

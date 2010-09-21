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
goog.require('goog.asserts');
goog.require('goog.array');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.events.EventTarget');
goog.require('goog.net.cookies');


/**
 * Event types.
 * @enum {string}
 */
cw.crosstab.EventType = {
	GOT_MASTER: goog.events.getUniqueId('got_master'),
	LOST_MASTER: goog.events.getUniqueId('lost_master'),
	BECAME_MASTER: goog.events.getUniqueId('became_master'),
	NEW_SLAVE: goog.events.getUniqueId('new_slave'),
	LOST_SLAVE: goog.events.getUniqueId('lost_slave'),
	MESSAGE: goog.events.getUniqueId('message')
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
 * @type {?number}
 * @private
 */
cw.crosstab.CrossNamedWindow.prototype.listenKey_ = null;

/**
 * A reference to the master, or null if I am the master.
 * @type {cw.crosstab.CrossNamedWindow}
 * @private
 */
cw.crosstab.CrossNamedWindow.prototype.master_ = null;

/**
 * Domain name to use for the cookie.  If you want cross-tab sharing
 * to work between mydomain.com and www.mydomain.com, call
 * {@code .setDomain("mydomain.com")} before calling {@code .start()}
 * @type {string}
 * @private
 */
cw.crosstab.CrossNamedWindow.prototype.domain_ = "";

/**
 * @private
 * @return {boolean} Whether this instance is a master (or unstarted).
 */
cw.crosstab.CrossNamedWindow.prototype.isMaster = function() {
	return !this.master_;
};

/**
 * @return {string}
 */
cw.crosstab.CrossNamedWindow.prototype.getWindowName = function() {
	return window.name;
};

/**
 * @private
 * @return {string}
 */
cw.crosstab.CrossNamedWindow.prototype.makeWindowName_ = function() {
	return '_CNW_' + cw.string.getCleanRandomString() + cw.string.getCleanRandomString();
};

/**
 * @param {string} domain
 * @private
 */
cw.crosstab.CrossNamedWindow.prototype.setDomain = function(domain) {
	this.domain_ = domain;
};

/**
 * @param {!cw.crosstab.CrossNamedWindow} slave
 */
cw.crosstab.CrossNamedWindow.prototype.addSlave = function(slave) {
	goog.asserts.assert(this.isMaster(), "addSlave: not master");
	this.slaves_.push(slave);
	this.dispatchEvent({
		type: cw.crosstab.EventType.NEW_SLAVE,
		slave: slave
	});
};

/**
 * @param {!cw.crosstab.CrossNamedWindow} slave
 */
cw.crosstab.CrossNamedWindow.prototype.removeSlave = function(slave) {
	goog.asserts.assert(this.isMaster(), "removeSlave: not master");
	var ret = goog.array.remove(this.slaves_, slave);
	if(!ret) {
		throw Error("I didn't know about slave " + slave);
	}
	this.dispatchEvent({
		type: cw.crosstab.EventType.LOST_SLAVE,
		slave: slave
	});
};

/**
 * @private
 */
cw.crosstab.CrossNamedWindow.prototype.becomeMaster_ = function() {
	var windowName = this.makeWindowName_();
	window.name = windowName;
	goog.net.cookies.set(this.cookieName_, windowName, -1, "", this.domain_);
	this.master_ = null;
	this.dispatchEvent({
		type: cw.crosstab.EventType.BECAME_MASTER
	});
};

/**
 * @param {string} masterName The window name of the master that probably exists.
 * @private
 */
cw.crosstab.CrossNamedWindow.prototype.getMaster_ = function(masterName) {
	var ret = window.open('', masterName,
		'height=1,width=1,location=0,menubar=0,scrollbars=0,' +
		'titlebar=0,toolbar=0,top=10000,left=10000');
	if(!ret || !ret['__theCrossNamedWindow'] || ret.closed) {
		try {
			ret.close();
		} catch(e) {

		}
		this.becomeMaster_();
	} else {
		this.master_ = /** @type {!cw.crosstab.CrossNamedWindow} */ (
			ret['__theCrossNamedWindow']);
		this.master_.addSlave(this);
		this.dispatchEvent({
			type: cw.crosstab.EventType.GOT_MASTER
		});
	}
};

/**
 * @param {string} masterName The window name of the master that probably exists.
 * @private
 */
cw.crosstab.CrossNamedWindow.prototype.getNewMaster_ = function(masterName) {
	goog.asserts.assert(!this.isMaster(), "getNewMaster_: not slave");
	this.dispatchEvent({
		type: cw.crosstab.EventType.LOST_MASTER
	});
	this.getMaster_(masterName);
};

/**
 * Send a message to the master.
 * @param {*} object The message to send.
 */
cw.crosstab.CrossNamedWindow.prototype.messageMaster = function(object) {
	if(!this.master_) {
		throw Error("No master.");
	}
	this.master_.messageSelf(object);
};

/**
 * Send a message to myself.  Typically called by the master.
 * @param {*} object The message to send.
 */
cw.crosstab.CrossNamedWindow.prototype.messageSelf = function(object) {
	this.dispatchEvent({
		type: cw.crosstab.EventType.MESSAGE,
		message: object
	});
};

/**
 * @param {Object} event
 * @private
 */
cw.crosstab.CrossNamedWindow.prototype.unloadFired_ = function(event) {
	this.dispose();
};

/**
 * Become a master or a slave.  If becoming a master, this will mutate
 * {@code window.name} and set a session cookie.
 */
cw.crosstab.CrossNamedWindow.prototype.start = function() {
	this.listenKey_ = goog.events.listen(window, goog.events.EventType.UNLOAD,
		this.unloadFired_, false, this);
	var masterName = goog.net.cookies.get(this.cookieName_);
	if(!masterName) {
		this.becomeMaster_();
	} else {
		this.getMaster_(masterName);
	}
};

cw.crosstab.CrossNamedWindow.prototype.disposeInternal = function() {
	if(this.isMaster()) {
		// Make the oldest slave the master, and tell the others to connect
		// to it.
		if(this.slaves_.length) {
			// pop the 0th slave
			var oldest = this.slaves_.splice(0, 1)[0];
			oldest.becomeMaster_();
			var newWindowName = oldest.getWindowName();

			while(this.slaves_.length) {
				this.slaves_.pop().getNewMaster_(newWindowName);
			}
		}
	} else {
		this.master_.removeSlave(this);
	}
	if(this.listenKey_) {
		goog.events.unlistenByKey(this.listenKey_);
	}
};

/**
 * @type {cw.crosstab.CrossNamedWindow}
 */
cw.crosstab.theCrossNamedWindow =
	new cw.crosstab.CrossNamedWindow('__CrossNamedWindow');

goog.global['__theCrossNamedWindow'] = cw.crosstab.theCrossNamedWindow;

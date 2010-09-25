/**
 * @fileoverview Utilities for sending information across already-open browser
 * 	tabs (or windows).
 *
 * See CrossNamedWindow_demo.html to see this in action.
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
goog.require('goog.debug.Logger');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.events.EventTarget');
goog.require('goog.net.cookies');


/**
 * Event types.
 * @enum {string}
 */
cw.crosstab.EventType = {
	/**
	 * When you receive this event, you should keep a reference to the master
	 * (event property "master"), so that you can send it messages.
	 */
	GOT_MASTER: goog.events.getUniqueId('got_master'),
	/**
	 * When you receive this event, you must delete your reference to the
	 * master.
	 */
	LOST_MASTER: goog.events.getUniqueId('lost_master'),
	/**
	 * Dispatched when the CrossNamedWindow becomes a master.  Note that
	 * this can happen after being a slave for a while.
	 */
	BECAME_MASTER: goog.events.getUniqueId('became_master'),
	/**
	 * When you receive this event, you should keep a reference to the slave
	 * (event property "slave"), so that you can send it messages.
	 */
	NEW_SLAVE: goog.events.getUniqueId('new_slave'),
	/**
	 * When you receive this event, you must delete your reference to the
	 * slave (which one? check event property "slave").
	 */
	LOST_SLAVE: goog.events.getUniqueId('lost_slave'),
	/**
	 * The actual message is contained in event property "message".
	 */
	MESSAGE: goog.events.getUniqueId('message')
};


/**
 * An object that automatically sets up synchronous connections
 * between tabs/windows.  Each tab is either a master or a slave.
 * There is one master per (scheme, port, document.domain, port).
 * If a master dies, another tab automatically becomes the master,
 * and all slaves attach to it.
 *
 * Do not use with Chrome or Chromium or IE8 or IE9, because
 * CrossNamedWindow does not work in multi-process browsers.
 *
 * Do not use with Safari because window.open(...) switches tabs in Safari.
 *
 * Do not use with Opera because it fails to fire unload events.
 *
 * @constructor
 * @extends {goog.events.EventTarget}
 */
cw.crosstab.CrossNamedWindow = function() {
	goog.events.EventTarget.call(this);

	/**
	 * @type {!Array.<!cw.crosstab.CrossNamedWindow>}
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
 * @return {boolean} Whether this instance is a master (or unstarted).
 * @private
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
 * @param {!Array.<string>} sb
 * @private
 */
cw.crosstab.CrossNamedWindow.prototype.__reprToPieces__ = function(sb) {
	sb.push('<CrossNamedWindow isMaster()=' + this.isMaster() +
		' getWindowName()=');
	cw.repr.reprToPieces(this.getWindowName(), sb);
	sb.push('>');
};

/**
 * @return {string}
 * @private
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
	if(!this.isMaster()) {
		throw Error("addSlave: this only works when master");
	}
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
	if(!this.isMaster()) {
		throw Error("removeSlave: this only works when master");
	}
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
 * Get the appropriate cookie name.
 *
 * Note that cookie security is much less strict than same-origin policy.  Cookie
 * visibility is controlled by (domain name, secure flag), while SOP requires
 * (protocol, document.domain, port) to match.  We add those three parameters
 * to the cookie name, so that we don't attempt to window.open(...) windows
 * that we can't access anyway.
 * @return {string}
 * @private
 */
cw.crosstab.CrossNamedWindow.prototype.getCookieName_ = function() {
	return '__CrossNamedWindow_' + window.location.port + '_' +
		window.location.protocol.replace(':', '') + '_' + document.domain;
};

/**
 * @private
 */
cw.crosstab.CrossNamedWindow.prototype.becomeMaster_ = function() {
	var windowName = this.makeWindowName_();
	window.name = windowName;
	this.master_ = null;
	goog.net.cookies.set(this.getCookieName_(), windowName, -1, "", this.domain_);
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
		try {
			this.master_.addSlave(this);
		} catch(e) {
			// An error is thrown in at least this case:
			// 1) We managed to grab a reference to the "master",
			// but the window was actually closed, and for some reason
			// it thinks it's a slave.  (This happened in Firefox 3.6.10
			// on 2010-09-21).
			this.becomeMaster_();
			return;
		}
		this.dispatchEvent({
			type: cw.crosstab.EventType.GOT_MASTER,
			master: this.master_
		});
	}
};

/**
 * @param {string} masterName The window name of the master that probably exists.
 * @private
 */
cw.crosstab.CrossNamedWindow.prototype.getNewMaster_ = function(masterName) {
	if(this.isMaster()) {
		throw Error("getNewMaster_: this only works when slave");
	}
	this.dispatchEvent({
		type: cw.crosstab.EventType.LOST_MASTER
	});
	this.getMaster_(masterName);
};

/**
 * Send a message to myself.
 * @param {*} object The message to send.
 */
cw.crosstab.CrossNamedWindow.prototype.message = function(object) {
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
	var masterName = goog.net.cookies.get(this.getCookieName_());
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
 * @type {!cw.crosstab.CrossNamedWindow}
 */
cw.crosstab.theCrossNamedWindow = new cw.crosstab.CrossNamedWindow();

goog.global['__theCrossNamedWindow'] = cw.crosstab.theCrossNamedWindow;



/**
 * An object that automatically sets up asynchronous connections
 * between tabs/windows, using a SharedWorker only to facilitate
 * the connections.
 *
 * Do not use with Opera because it doesn't fire onunload reliably.

 * Possible event orderings:
 * 1)
 * - get response from S.W. before initialDecisionTime, become master
 *
 * 2)
 * - get response from S.W. before initialDecisionTime, become slave
 *
 * 3)
 * - don't get response from S.W. before initialDecisionTime, become master
 *
 * 4)
 * - don't get response from S.W. before initialDecisionTime, become master
 * - get response from S.W.; it says to be master.  Woohoo!  We guessed right!
 *
 * 5)
 * - don't get response from S.W. before initialDecisionTime, become master
 * - get response from S.W.; it says to be slave
 * - (if allowMaster2Slave) become slave (else) stay master
 *
 * And any time, slave may become master.
 *
 * @param {!cw.clock.IWindowTimeIntervalOptional} clock
 *
 * @param {number} initialDecisionTime Maximum time in ms to make an initial
 * 	decision about whether to be master or worker.  Why might it take a while?
 * 	Because spawning a Worker in Chrome could take a second or more.
 *
 * @param {boolean} allowMaster2Slave Whether to allow a master -> slave
 * 	transition.  Such a transition might happen if CrossSharedWorker decides to
 * 	be master before getting a response from the SharedWorker.
 *
 * @constructor
 * @extends {goog.events.EventTarget}
 */
cw.crosstab.CrossSharedWorker = function(clock, initialDecisionTime, allowMaster2Slave) {
	goog.events.EventTarget.call(this);

	/**
	 * @type {!Array.<!XXX>}
	 */
	this.slaves_ = [];

	/**
	 * @type {!cw.clock.IWindowTimeIntervalOptional}
	 */
	this.clock_ = clock;

	/**
	 * @type {number}
	 */
	this.initialDecisionTime_ = initialDecisionTime;

	/**
	 * @type {boolean}
	 */
	this.allowMaster2Slave_ = allowMaster2Slave;
};
goog.inherits(cw.crosstab.CrossSharedWorker, goog.events.EventTarget);

/**
 * @type {!goog.debug.Logger}
 * @protected
 */
cw.crosstab.CrossSharedWorker.prototype.logger_ =
	goog.debug.Logger.getLogger('cw.crosstab.CrossSharedWorker');

/**
 * @type {!SharedWorker}
 * @private
 */
cw.crosstab.CrossSharedWorker.prototype.worker_;

/**
 * @type {?number}
 * @private
 */
cw.crosstab.CrossSharedWorker.prototype.listenKey_ = null;

/**
 * @type {?number}
 * @private
 */
cw.crosstab.CrossSharedWorker.prototype.timeoutTicket_ = null;

/**
 * A reference to the master, or null if I am the master.
 * @type {cw.crosstab.CrossNamedWindow}
 * @private
 */
cw.crosstab.CrossSharedWorker.prototype.master_ = null;

/**
 * @return {boolean} Whether this instance is a master (or no response
 * 	from SharedWorker yet).
 * @private
 */
cw.crosstab.CrossSharedWorker.prototype.isMaster = function() {
	return !this.master_;
};

/**
 * @param {!Array.<string>} sb
 * @private
 */
cw.crosstab.CrossSharedWorker.prototype.__reprToPieces__ = function(sb) {
	sb.push('<CrossSharedWorker isMaster()=' + this.isMaster());
	sb.push('>');
};

/**
 * @param {Object} event
 * @private
 */
cw.crosstab.CrossSharedWorker.prototype.unloadFired_ = function(event) {
	this.dispose();
};

/**
 * @private
 */
cw.crosstab.CrossSharedWorker.prototype.becomeMaster_ = function() {
	1/0
};

/**
 * @private
 */
cw.crosstab.CrossSharedWorker.prototype.becomeSlave_ = function(masterPort) {
	this.master_ = masterPort;
};

/**
 * @private
 */
cw.crosstab.CrossSharedWorker.prototype.timedOut_ = function() {
	this.becomeMaster_();
};

/**
 * @private
 */
cw.crosstab.CrossSharedWorker.prototype.clearTimeout_ = function() {
	if(this.timeoutTicket_) {
		this.clock_.clearTimeout(this.timeoutTicket_);
	};
};

/**
 * @private
 */
cw.crosstab.CrossSharedWorker.prototype.onMessageFromPeer_ = function(e) {

};


/**
 * @private
 */
cw.crosstab.CrossSharedWorker.prototype.onMessageFromWorker_ = function(e) {
	this.clearTimeout_();

	var numPorts = e.ports && e.ports.length || 0
	this.logger_.finest('Got message: ' + cw.repr.repr(e.data) +
		' with ' + numPorts + ' port(s)');
	if(e.data == "umaster") {
		this.becomeMaster_();
	} else if(e.data == "port2master") {
		var masterPort = e.ports[0];
		this.becomeSlave_(masterPort);
		this.master_.onmessage = goog.bind(this.onMessageFromPeer_, this);
	} else if(e.data == "port2slave") {
		var slave = e.ports[0];
		this.slaves_.push(slave);
		slave.onmessage = function(s) {
			this.logger_.finest('Text from slave #TODO: ' + s.data);
		}
	}
};

/**
 * Become a master or a slave.  The three possible outcomes are:
 * 	- Become master, and start/connect to a SharedWorker
 * 	- Become master, without being able to start/connect to a SharedWorker
 * 	- Become slave, and start/connect to a SharedWorker
 */
cw.crosstab.CrossSharedWorker.prototype.start = function() {
	this.listenKey_ = goog.events.listen(window, goog.events.EventType.UNLOAD,
		this.unloadFired_, false, this);

	try {
		this.worker_ = new SharedWorker('/compiled/crossSharedWorker.js');
	} catch(e) {
		// In Opera 10.70 (9049), if the worker cannot be instantiated
		// because it has reached the limit for the number of workers,
		// it throws "Error: QUOTA_EXCEEDED_ERR".
		this.logger_.warning('Failed to instantiate SharedWorker: ' + e);
	}

	this.timeoutTicket_ = this.clock_.setTimeout(goog.bind(this.timedOut_, this), this.initialDecisionTime_);

	this.worker_.port.onmessage = goog.bind(this.onMessageFromWorker_, this);
};

cw.crosstab.CrossSharedWorker.prototype.disposeInternal = function() {
	this.clearTimeout_();

	if(this.listenKey_) {
		goog.events.unlistenByKey(this.listenKey_);
	}
};

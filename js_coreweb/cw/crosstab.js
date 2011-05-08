/**
 * @fileoverview Utilities for sending information across already-open browser
 * 	tabs (or windows).
 *
 * See CrossNamedWindow_demo.html to see this in action.
 */


goog.provide('cw.crosstab');

goog.require('cw.string');
goog.require('goog.array');
goog.require('goog.debug.Logger');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.events.EventTarget');
goog.require('goog.structs.Map');
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
	 * this can happen after being a slave for a while.  For evacuated data,
	 * read event property "evacuatedData".
	 */
	BECAME_MASTER: goog.events.getUniqueId('became_master'),

	/**
	 * Dispatched right before a CrossNamedWindow or CrossSharedWorker dies.
	 * If a master, you may want to call .setDataToEvacuate(...) under the
	 * stack frame of the dispatched event.
	 */
	DYING: goog.events.getUniqueId('dying'),

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
	 * The actual message is contained in event property "message",
	 * and the sender in event property "sender".
	 *
	 * Note that for CrossSharedWorker, you may continue receiving
	 * messages from a master that has gone offline!  This is because
	 * the MESSAGEs arrive over a separate MessageChannel.
	 * See Coreweb/docs/CrossSharedWorker-master-race-condition-*.png
	 */
	MESSAGE: goog.events.getUniqueId('message')
};


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
 * TODO:
 * - Don't connect to master tab if it's wrong a different version of the
 * 	code, or find another solution to this problem.
 *
 * - Make this work in Chrome by allowing multiple masters, or by trying to
 * 	connect to window.opener.
 *
 * @constructor
 * @extends {goog.events.EventTarget}
 */
cw.crosstab.CrossNamedWindow = function() {
	goog.events.EventTarget.call(this);

	/**
	 * @type {string}
	 * @private
	 */
	this.id_ = '_CNW_' + cw.string.getCleanRandomString() +
		cw.string.getCleanRandomString();

	/**
	 * @type {!Array.<!cw.crosstab.CrossNamedWindow>}
	 * @private
	 */
	this.slaves_ = [];
};
goog.inherits(cw.crosstab.CrossNamedWindow, goog.events.EventTarget);

/**
 * @type {!goog.debug.Logger}
 * @protected
 */
cw.crosstab.CrossNamedWindow.prototype.logger_ =
	goog.debug.Logger.getLogger('cw.crosstab.CrossNamedWindow');

/**
 * @type {?string}
 * @private
 */
cw.crosstab.CrossNamedWindow.prototype.cookieName_ = null;

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
 * If this master dies, this data is sent to the next master.
 * @type {*}
 * @private
 */
cw.crosstab.CrossNamedWindow.prototype.dataToEvacuate_ = null;

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
 * @param {!Array.<*>} stack
 */
cw.crosstab.CrossNamedWindow.prototype.__reprPush__ = function(sb, stack) {
	sb.push('<CrossNamedWindow isMaster()=' + this.isMaster() +
		' id_=');
	cw.repr.reprPush(this.id_, sb, stack);
	sb.push('>');
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
		throw Error("I didn't know about slave " + cw.repr.repr(slave));
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
 * @param {*} evacuatedData
 * @private
 */
cw.crosstab.CrossNamedWindow.prototype.becomeMaster_ = function(evacuatedData) {
	this.logger_.info('Becoming master.');
	window.name = this.id_;
	this.master_ = null;
	if(!this.cookieName_) {
		throw Error("No cookieName_? Forgot to start()?");
	}
	goog.net.cookies.set(this.cookieName_, this.id_, -1, "", this.domain_);
	this.dispatchEvent({
		type: cw.crosstab.EventType.BECAME_MASTER,
		evacuatedData: evacuatedData
	});
};

/**
 * @param {string} masterName The window name of the master that probably exists.
 * @private
 */
cw.crosstab.CrossNamedWindow.prototype.getMaster_ = function(masterName) {
	this.logger_.info('Trying to grab master.');
	var ret = window.open('', masterName,
		'height=1,width=1,location=0,menubar=0,scrollbars=0,' +
		'titlebar=0,toolbar=0,top=10000,left=10000');
	if(!ret || !ret['__theCrossNamedWindow'] || ret.closed) {
		this.logger_.info('Failed to grab window, or bad window.');
		// Could not get a reference to the window, or got a bad window,
		// so try to close it, then become the master instead.
		try {
			ret.close();
		} catch(e) {
		}
		this.becomeMaster_(null);
	} else {
		this.master_ = /** @type {!cw.crosstab.CrossNamedWindow} */ (
			ret['__theCrossNamedWindow']);
		// Tell the master about us.
		try {
			this.master_.addSlave(this);
		} catch(e) {
			// An error was thrown, so become the master instead.
			// The error is thrown in at least this case:
			// 1) We managed to grab a reference to the "master",
			// but the window was actually closed, and for some reason
			// it thinks it's a slave.  (This happened in Firefox 3.6.10
			// on 2010-09-21).
			this.logger_.warning('master_.addSlave threw Error: ' + e);
			this.becomeMaster_(null);
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
 * Send a message to a recipient.
 * @param {!cw.crosstab.CrossNamedWindow} recipient
 * @param {*} object The message to send.
 */
cw.crosstab.CrossNamedWindow.prototype.messageTo = function(recipient, object) {
	recipient.dispatchEvent({
		type: cw.crosstab.EventType.MESSAGE,
		sender: this,
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
	this.cookieName_ = this.getCookieName_();
	this.listenKey_ = goog.events.listen(window, goog.events.EventType.UNLOAD,
		this.unloadFired_, false, this);
	var masterName = goog.net.cookies.get(this.cookieName_);
	this.logger_.info('Existing cookie ' + cw.repr.repr(this.cookieName_) + '=' +
		cw.repr.repr(masterName));
	if(!masterName) {
		this.becomeMaster_(null);
	} else {
		this.getMaster_(masterName);
	}
};

/**
 * @param {*} data
 */
cw.crosstab.CrossNamedWindow.prototype.setDataToEvacuate = function(data) {
	this.dataToEvacuate_ = data;
};

cw.crosstab.CrossNamedWindow.prototype.disposeInternal = function() {
	this.dispatchEvent({
		type: cw.crosstab.EventType.DYING
	});
	if(this.isMaster()) {
		// Remove the cookie.
		if(this.cookieName_) {
			goog.net.cookies.set(this.cookieName_, "", 0, "", this.domain_);
		}
		// Make the oldest slave the master, and tell the others to connect
		// to it.
		if(this.slaves_.length) {
			// pop the 0th slave
			var oldest = this.slaves_.splice(0, 1)[0];
			oldest.becomeMaster_(this.dataToEvacuate_);
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

	// This must be done after DYING is dispatched above.
	cw.crosstab.CrossNamedWindow.superClass_.disposeInternal.call(this);
};

/**
 * @type {!cw.crosstab.CrossNamedWindow}
 */
cw.crosstab.theCrossNamedWindow = new cw.crosstab.CrossNamedWindow();

goog.global['__theCrossNamedWindow'] = cw.crosstab.theCrossNamedWindow;


/**
 * @param {number} id
 * @param {!MessagePort} port
 * @constructor
 */
cw.crosstab.Peer = function(id, port) {
	/**
	 * @type {number}
	 */
	this.id = id;

	/**
	 * @type {!MessagePort}
	 * @private
	 */
	this.port_ = port;
};


/**
 * @param {!Array.<string>} sb
 * @param {!Array.<*>} stack
 */
cw.crosstab.Peer.prototype.__reprPush__ = function(sb, stack) {
	sb.push('<Peer id=');
	cw.repr.reprPush(this.id, sb, stack);
	sb.push('>');
};



/**
 * An object that automatically sets up asynchronous connections
 * between tabs/windows, using a SharedWorker only to facilitate
 * the connections.
 *
 * Do not use with Opera because it doesn't fire onunload reliably.
 *
 * CrossSharedWorker is not reliable yet!  Don't use it.  We might have
 * to abandon it and have the SharedWorker itself do all of the hard work.
 * This was the TODO before ivank stopped working on it:
 *
 * - Make sure our use of postMessage is safe (other sites can't send msg)
 *
 * - Make CrossSharedWorker / tabnexus work properly if master crashes,
 * 	and also detect slave crashes.
 *
 * - Figure out if all messages over MessageChannel delivered even as
 *	tab is closing.  If not, we may have to scrap CrossSharedWorker.
 * 	Experiments show that they're not always delivered in Chrome
 * 	if very large.  Also, a tab may become a new master before all
 * 	messages from the old master are delivered.
 *
 * - Figure out if we want a master->slave transition.  Probably yes, because
 * 	opening that worker could take a really long time.
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
	 * @type {!goog.structs.Map}
	 */
	this.slaves_ = new goog.structs.Map();

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
 * How many masters I have ever connected to.
 * @type {number}
 * @private
 */
cw.crosstab.CrossSharedWorker.prototype.masterCount_ = 0;

/**
 * A reference to the master, or null if I am the master (or never connected
 * 	to one).
 * @type {cw.crosstab.Peer}
 * @private
 */
cw.crosstab.CrossSharedWorker.prototype.master_ = null;

/**
 * If this master dies, this data is sent to the next master.
 * @type {*}
 * @private
 */
cw.crosstab.CrossSharedWorker.prototype.dataToEvacuate_ = null;

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
 * @param {!Array.<*>} stack
 */
cw.crosstab.CrossSharedWorker.prototype.__reprPush__ = function(sb, stack) {
	sb.push('<CrossSharedWorker isMaster()=', String(this.isMaster()), '>');
};

/**
 * @param {Object} event
 * @private
 */
cw.crosstab.CrossSharedWorker.prototype.unloadFired_ = function(event) {
	this.dispose();
};

/**
 * @param {*} evacuatedData
 * @private
 */
cw.crosstab.CrossSharedWorker.prototype.becomeMaster_ = function(evacuatedData) {
	this.logger_.info('Becoming master.');
	this.master_ = null;
	this.dispatchEvent({
		type: cw.crosstab.EventType.BECAME_MASTER,
		evacuatedData: evacuatedData
	});
};

/**
 * @private
 */
cw.crosstab.CrossSharedWorker.prototype.timedOut_ = function() {
	this.logger_.info('Timed out waiting for SharedWorker.');
	this.becomeMaster_(null);
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
 * @param {!cw.crosstab.Peer} peer
 * @param {!MessageEvent} e
 * @private
 */
cw.crosstab.CrossSharedWorker.prototype.onMessageFromPeer_ = function(peer, e) {
	var data = e.data;
	if(goog.isArray(data)) {
		if(data[0] == 'payload') {
			var payload = data[1];
			this.dispatchEvent({
				type: cw.crosstab.EventType.MESSAGE,
				sender: peer,
				message: payload
			});
		}
	}
};

/**
 * Send a message to a recipient.
 * @param {!cw.crosstab.Peer} recipient
 * @param {*} object The message to send.
 */
cw.crosstab.CrossSharedWorker.prototype.messageTo = function(recipient, object) {
	recipient.port_.postMessage(['payload', object]);
};

/**
 * @param {number} masterId
 * @param {!MessagePort} masterPort
 * @private
 */
cw.crosstab.CrossSharedWorker.prototype.getMaster_ = function(masterId, masterPort) {
	if(this.master_) {
		this.master_.port_.close();
		this.master_ = null;
		this.dispatchEvent({
			type: cw.crosstab.EventType.LOST_MASTER
		});
	}
	this.master_ = new cw.crosstab.Peer(masterId, masterPort);
	this.dispatchEvent({
		type: cw.crosstab.EventType.GOT_MASTER,
		master: this.master_
	});
	masterPort.onmessage = goog.bind(this.onMessageFromPeer_, this, this.master_);
};

/**
 * @param {number} slaveId
 * @param {!MessagePort} slavePort
 * @private
 */
cw.crosstab.CrossSharedWorker.prototype.addSlave_ = function(slaveId, slavePort) {
	if(!this.isMaster()) {
		throw Error("addSlave: this only works when master");
	}
	var slave = new cw.crosstab.Peer(slaveId, slavePort);
	this.slaves_.set(slaveId, slave);
	this.dispatchEvent({
		type: cw.crosstab.EventType.NEW_SLAVE,
		slave: slave
	});
	slavePort.onmessage = goog.bind(this.onMessageFromPeer_, this, slave);
};

/**
 * @param {number} slaveId
 * @private
 */
cw.crosstab.CrossSharedWorker.prototype.removeSlave_ = function(slaveId) {
	var slave = this.slaves_.get(slaveId);
	if(!slave) {
		throw Error("I didn't know about slave " + cw.repr.repr(slaveId));
	}
	this.slaves_.remove(slaveId);
	slave.port_.close();
	this.dispatchEvent({
		type: cw.crosstab.EventType.LOST_SLAVE,
		slave: slave
	});
};

/**
 * @private
 */
cw.crosstab.CrossSharedWorker.prototype.onMessageFromWorker_ = function(e) {
	this.clearTimeout_();

	var numPorts = e.ports && e.ports.length || 0
	this.logger_.finest('Got message: ' + cw.repr.repr(e.data) +
		' with ' + numPorts + ' port(s)');
	var data = e.data;
	if(goog.isArray(data)) {
		var command = data[0];
		if(command == 'become_master') {
			var evacuatedData = data[1];
			this.becomeMaster_(evacuatedData);
		} else if(command == 'connect_to_master') {
			var masterId = /** @type {number} */(data[1]);
			var masterPort = e.ports[0];
			this.getMaster_(masterId, masterPort);
		} else if(command == 'add_slave') {
			var slaveId = /** @type {number} */(data[1]);
			var slavePort = e.ports[0];
			this.addSlave_(slaveId, slavePort);
		} else if(command == 'remove_slave') {
			var slaveId = /** @type {number} */(data[1]);
			this.removeSlave_(slaveId);
		} else if(command == 'error_in_worker') {
			var error = data[1];
			this.logger_.severe('Error in worker: ' + error);
		}
	}
};

/**
 * @param {*} data
 */
cw.crosstab.CrossSharedWorker.prototype.setDataToEvacuate = function(data) {
	this.dataToEvacuate_ = data;
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
		this.worker_ = new SharedWorker('/compiled/tabnexus_worker.js');
	} catch(e) {
		// In Opera 10.70 (9049), if the worker cannot be instantiated
		// because it has reached the limit for the number of workers,
		// it throws "Error: QUOTA_EXCEEDED_ERR".
		this.logger_.warning('Failed to instantiate SharedWorker: ' + e);
	}

	/**
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
	 */
	this.timeoutTicket_ = this.clock_.setTimeout(goog.bind(this.timedOut_, this), this.initialDecisionTime_);

	this.worker_.port.onmessage = goog.bind(this.onMessageFromWorker_, this);
};

cw.crosstab.CrossSharedWorker.prototype.disposeInternal = function() {
	this.clearTimeout_();

	if(this.listenKey_) {
		goog.events.unlistenByKey(this.listenKey_);
	}

	this.dispatchEvent({
		type: cw.crosstab.EventType.DYING
	});
	this.worker_.port.postMessage(['dying', this.dataToEvacuate_]);
	this.worker_.port.close();

	if(this.master_) {
		this.master_.port_.close();
	}
	var slaves = this.slaves_.getValues();
	while(slaves.length) {
		slaves.pop().port_.close();
	}

	// This must be done after DYING is dispatched above.
	cw.crosstab.CrossSharedWorker.superClass_.disposeInternal.call(this);
};

/**
 * @fileoverview Used by CrossSharedWorker_demo.html
 */
goog.provide('cswdemo');

goog.require('goog.array');
goog.require('goog.debug.DivConsole');
goog.require('goog.debug.Logger');
goog.require('goog.string');
goog.require('goog.Uri');

goog.require('cw.autoTitle');
goog.require('cw.repr');
goog.require('cw.crosstab');


/**
 * @constructor
 */
cswdemo.Demo = function() {
	/**
	 * @type {!Array.<!cw.crosstab.Peer>}
	 */
	this.slaves_ = [];

	/**
	 * @type {cw.crosstab.Peer}
	 */
	this.master_ = null;

	/**
	 * @type {boolean}
	 */
	this.sendBig_ = this.shouldSendBigData_();
};

/**
 * @type {!goog.debug.Logger}
 * @protected
 */
cswdemo.Demo.prototype.logger_ =
	goog.debug.Logger.getLogger('cswdemo.Demo');

/**
 * @return {boolean}
 * @private
 */
cswdemo.Demo.prototype.shouldSendBigData_ = function() {
	var url = new goog.Uri(document.location);
	var queryData = url.getQueryData();
	return Boolean(Number(queryData.get('bigdata', '0')));
};

cswdemo.Demo.prototype.gotMaster_ = function(ev) {
	this.logger_.info('Got master: ' + cw.repr.repr(ev.master));
	this.master_ = ev.master;
};

cswdemo.Demo.prototype.lostMaster_ = function(ev) {
	this.logger_.info('Lost master');
	this.master_ = null;
};

cswdemo.Demo.prototype.becameMaster_ = function(ev) {
	var evacuatedData = ev.evacuatedData;
	this.logger_.info('Became master with evacuatedData: ' +
		this.describeObject_(evacuatedData));
};

cswdemo.Demo.prototype.newSlave_ = function(ev) {
	this.logger_.info('New slave: ' + cw.repr.repr(ev.slave));
	this.slaves_.push(ev.slave);
};

cswdemo.Demo.prototype.lostSlave_ = function(ev) {
	this.logger_.info('Lost slave: ' + cw.repr.repr(ev.slave));
	var ret = goog.array.remove(this.slaves_, ev.slave);
	if(!ret) {
		throw Error("cswdemo.Demo didn't know about slave " + ev.slave);
	}
};

cswdemo.Demo.prototype.message_ = function(ev) {
	this.logger_.info('Got message from ' + cw.repr.repr(ev.sender) +
		': ' + this.describeObject_(ev.message));
};

/**
 * Return a string that describes the object, without repr'ing the whole
 * thing if it's an Array (because it may be very big).
 * @param {*} obj
 * @return {string}
 */
cswdemo.Demo.prototype.describeObject_ = function(obj) {
	if(goog.isArray(obj)) {
		return '<Array of length ' + obj.length + '>';
	} else {
		return cw.repr.repr(obj);
	}
};

/**
 * @return {!Array} an Array that serializes to about ~40MB of JSON.
 */
cswdemo.Demo.prototype.getBigObject_ = function() {
	var string = Array(1024 + 1).join('x');
	var a = [];
	// ~40MB and Chrome is fine; ~100MB and the message somehow gets lost.
	for(var i=0; i < 40000; i++) {
		a.push(string);
	}
	return a;
};

cswdemo.Demo.prototype.dying_ = function(ev) {
	if(this.csw.isMaster()) {
		var data = this.sendBig_ ? this.getBigObject_() : goog.now();
		// Send objects to all of the slaves, to confirm that data is
		// received even if this tab is closing.
		this.sendObjectToSlaves('small object');
		this.sendObjectToSlaves(data);
		for(var i=0; i < 40; i++) {
			this.sendObjectToSlaves('another small object #' + i);
		}
	} else {
		var data = 'this is not used for anything';
	}

	this.csw.setDataToEvacuate(data);
	this.logger_.info('Dying');
};

/**
 * @param {*} obj
 */
cswdemo.Demo.prototype.sendObjectToSlaves = function(obj) {
	for(var i=0; i < this.slaves_.length; i++) {
		var slave = this.slaves_[i];
		this.csw.messageTo(slave, obj);
	};
	this.logger_.info('Sent ' + this.describeObject_(obj) +
		' to ' + this.slaves_.length + ' slave(s)');
};

/**
 * @param {*} obj
 */
cswdemo.Demo.prototype.sendObjectToMaster = function(obj) {
	if(!this.master_) {
		throw Error("sendObjectToMaster: master_ is null");
	}
	this.csw.messageTo(this.master_, obj);
	this.logger_.info('Sent ' + this.describeObject_(obj) + ' to master');
};

cswdemo.Demo.prototype.start = function() {
	this.csw = new cw.crosstab.CrossSharedWorker(goog.global['window'], 3000, false);
	this.csw.addEventListener(cw.crosstab.EventType.GOT_MASTER, this.gotMaster_, false, this);
	this.csw.addEventListener(cw.crosstab.EventType.LOST_MASTER, this.lostMaster_, false, this);
	this.csw.addEventListener(cw.crosstab.EventType.BECAME_MASTER, this.becameMaster_, false, this);
	this.csw.addEventListener(cw.crosstab.EventType.NEW_SLAVE, this.newSlave_, false, this);
	this.csw.addEventListener(cw.crosstab.EventType.LOST_SLAVE, this.lostSlave_, false, this);
	this.csw.addEventListener(cw.crosstab.EventType.MESSAGE, this.message_, false, this);
	this.csw.addEventListener(cw.crosstab.EventType.DYING, this.dying_, false, this);

	this.csw.start();
};

/**
 * @param {string} text
 */
cswdemo.Demo.prototype.sendText = function(text) {
	if(this.csw.isMaster()) {
		this.sendObjectToSlaves(text);
	} else {
		this.sendObjectToMaster(text);
	}
};


cswdemo.start = function() {
	new goog.debug.DivConsole(document.getElementById('log')).setCapturing(true);

	cswdemo.logger = goog.debug.Logger.getLogger('cswdemo.logger');
	cswdemo.logger.setLevel(goog.debug.Logger.Level.ALL);

	cswdemo.logger.info('Logger works.');

	window.onerror = function(msg, url, lineNumber) {
		cswdemo.logger.severe('window.onerror: message: ' + cw.repr.repr(msg) +
			'\nURL: ' + url + '\nLine Number: ' + lineNumber)
	};

	cswdemo.lastDemo = new cswdemo.Demo();
	cswdemo.lastDemo.start();
};

goog.exportSymbol('__cswdemo_start', cswdemo.start);

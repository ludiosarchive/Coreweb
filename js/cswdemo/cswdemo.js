/**
 * @fileoverview Used by CrossSharedWorker_demo.html
 */
goog.provide('cswdemo');

goog.require('goog.array');
goog.require('goog.debug.DivConsole');
goog.require('goog.debug.Logger');
goog.require('goog.string');

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
};

/**
 * @type {!goog.debug.Logger}
 * @protected
 */
cswdemo.Demo.prototype.logger_ =
	goog.debug.Logger.getLogger('cswdemo.Demo');

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
		cw.repr.repr(evacuatedData));
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
		': ' + cw.repr.repr(ev.message));
};

cswdemo.Demo.prototype.dying_ = function(ev) {
	this.csw.setDataToEvacuate(goog.now());
	this.logger_.info('Dying');
};

/**
 * @param {string} text
 */
cswdemo.Demo.prototype.sendTextToSlaves = function(text) {
	for(var i=0; i < this.slaves_.length; i++) {
		var slave = this.slaves_[i];
		this.csw.messageTo(slave, text);
	};
	this.logger_.info('Sent ' + cw.repr.repr(text) + ' to ' + this.slaves_.length + ' slave(s)');
};

/**
 * @param {string} text
 */
cswdemo.Demo.prototype.sendTextToMaster = function(text) {
	if(!this.master_) {
		throw Error("sendTextToMaster: master_ is null");
	}
	this.csw.messageTo(this.master_, text);
	this.logger_.info('Sent ' + cw.repr.repr(text) + ' to master');
};

cswdemo.Demo.prototype.start = function() {
	this.csw = new cw.crosstab.CrossSharedWorker(window, 3000, false);
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
		this.sendTextToSlaves(text);
	} else {
		this.sendTextToMaster(text);
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

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
	 * @type {!Array.<!cw.crosstab.CrossSharedWorker>}
	 */
	this.slaves_ = [];

	/**
	 * @type {cw.crosstab.CrossSharedWorker}
	 */
	this.master_ = null;
};

cswdemo.Demo.prototype.gotMaster_ = function(ev) {
	cswdemo.logger.info('Got master: ' + cw.repr.repr(ev.master));
	this.master_ = ev.master;
};

cswdemo.Demo.prototype.lostMaster_ = function(ev) {
	cswdemo.logger.info('Lost master');
	this.master_ = null;
};

cswdemo.Demo.prototype.becameMaster_ = function(ev) {
	cswdemo.logger.info('Became master');
};

cswdemo.Demo.prototype.newSlave_ = function(ev) {
	cswdemo.logger.info('New slave: ' + cw.repr.repr(ev.slave));
	this.slaves_.push(ev.slave);
};

cswdemo.Demo.prototype.lostSlave_ = function(ev) {
	cswdemo.logger.info('Lost slave: ' + cw.repr.repr(ev.slave));
		this.slaves_.push(ev.slave);
	var ret = goog.array.remove(this.slaves_, ev.slave);
	if(!ret) {
		throw Error("cswdemo.Demo didn't know about slave " + ev.slave);
	}
};

cswdemo.Demo.prototype.message_ = function(ev) {
	cswdemo.logger.info('Got message from ' + cw.repr.repr(ev.sender) +
		': ' + cw.repr.repr(ev.message));
};

/**
 * @param {string} text
 */
cswdemo.Demo.prototype.sendTextToSlaves = function(text) {
	for(var i=0; i < this.slaves_.length; i++) {
		var slave = this.slaves_[i];
		cw.crosstab.theCrossSharedWorker.messageTo(slave, text);
	};
	cswdemo.logger.info('Sent ' + cw.repr.repr(text) + ' to ' + this.slaves_.length + ' slave(s)');
};

/**
 * @param {string} text
 */
cswdemo.Demo.prototype.sendTextToMaster = function(text) {
	if(!this.master_) {
		throw Error("sendTextToMaster: master_ is null");
	}
	cw.crosstab.theCrossSharedWorker.messageTo(this.master_, text);
	cswdemo.logger.info('Sent ' + cw.repr.repr(text) + ' to master');
};

cswdemo.Demo.prototype.start = function() {
	var csw = cw.crosstab.theCrossSharedWorker;
	csw.addEventListener(cw.crosstab.EventType.GOT_MASTER, this.gotMaster_, false, this);
	csw.addEventListener(cw.crosstab.EventType.LOST_MASTER, this.lostMaster_, false, this);
	csw.addEventListener(cw.crosstab.EventType.BECAME_MASTER, this.becameMaster_, false, this);
	csw.addEventListener(cw.crosstab.EventType.NEW_SLAVE, this.newSlave_, false, this);
	csw.addEventListener(cw.crosstab.EventType.LOST_SLAVE, this.lostSlave_, false, this);
	csw.addEventListener(cw.crosstab.EventType.MESSAGE, this.message_, false, this);

	csw.start();
};

/**
 * @param {string} text
 */
cswdemo.sendText = function(text) {
	if(cw.crosstab.theCrossSharedWorker.isMaster()) {
		cswdemo.lastDemo.sendTextToSlaves(text);
	} else {
		cswdemo.lastDemo.sendTextToMaster(text);
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

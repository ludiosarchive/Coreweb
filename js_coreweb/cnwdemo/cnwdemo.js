/**
 * @fileoverview Used by CrossNamedWindow_demo.html
 */
goog.provide('cnwdemo');

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
cnwdemo.Demo = function() {
	/**
	 * @type {!Array.<!cw.crosstab.CrossNamedWindow>}
	 */
	this.slaves_ = [];

	/**
	 * @type {cw.crosstab.CrossNamedWindow}
	 */
	this.master_ = null;
};

/**
 * @type {!goog.debug.Logger}
 * @protected
 */
cnwdemo.Demo.prototype.logger_ =
	goog.debug.Logger.getLogger('cnwdemo.Demo');

cnwdemo.Demo.prototype.gotMaster_ = function(ev) {
	this.logger_.info('Got master: ' + cw.repr.repr(ev.master));
	this.master_ = ev.master;
};

cnwdemo.Demo.prototype.lostMaster_ = function(ev) {
	this.logger_.info('Lost master');
	this.master_ = null;
};

cnwdemo.Demo.prototype.becameMaster_ = function(ev) {
	var evacuatedData = ev.evacuatedData;
	this.logger_.info('Became master with evacuatedData: ' +
		cw.repr.repr(evacuatedData));
};

cnwdemo.Demo.prototype.newSlave_ = function(ev) {
	this.logger_.info('New slave: ' + cw.repr.repr(ev.slave));
	this.slaves_.push(ev.slave);
};

cnwdemo.Demo.prototype.lostSlave_ = function(ev) {
	this.logger_.info('Lost slave: ' + cw.repr.repr(ev.slave));
	var ret = goog.array.remove(this.slaves_, ev.slave);
	if(!ret) {
		throw Error("cnwdemo.Demo didn't know about slave " + ev.slave);
	}
};

cnwdemo.Demo.prototype.message_ = function(ev) {
	this.logger_.info('Got message from ' + cw.repr.repr(ev.sender) +
		': ' + cw.repr.repr(ev.message));
};

cnwdemo.Demo.prototype.dying_ = function(ev) {
	cw.crosstab.theCrossNamedWindow.setDataToEvacuate(goog.now());
	this.logger_.info('Dying');
};

/**
 * @param {string} text
 */
cnwdemo.Demo.prototype.sendTextToSlaves = function(text) {
	for(var i=0; i < this.slaves_.length; i++) {
		var slave = this.slaves_[i];
		cw.crosstab.theCrossNamedWindow.messageTo(slave, text);
	};
	this.logger_.info('Sent ' + cw.repr.repr(text) + ' to ' + this.slaves_.length + ' slave(s)');
};

/**
 * @param {string} text
 */
cnwdemo.Demo.prototype.sendTextToMaster = function(text) {
	if(!this.master_) {
		throw Error("sendTextToMaster: master_ is null");
	}
	cw.crosstab.theCrossNamedWindow.messageTo(this.master_, text);
	this.logger_.info('Sent ' + cw.repr.repr(text) + ' to master');
};

cnwdemo.Demo.prototype.start = function() {
	var cnw = cw.crosstab.theCrossNamedWindow;
	cnw.addEventListener(cw.crosstab.EventType.GOT_MASTER, this.gotMaster_, false, this);
	cnw.addEventListener(cw.crosstab.EventType.LOST_MASTER, this.lostMaster_, false, this);
	cnw.addEventListener(cw.crosstab.EventType.BECAME_MASTER, this.becameMaster_, false, this);
	cnw.addEventListener(cw.crosstab.EventType.NEW_SLAVE, this.newSlave_, false, this);
	cnw.addEventListener(cw.crosstab.EventType.LOST_SLAVE, this.lostSlave_, false, this);
	cnw.addEventListener(cw.crosstab.EventType.MESSAGE, this.message_, false, this);
	cnw.addEventListener(cw.crosstab.EventType.DYING, this.dying_, false, this);

	cnw.start();
};

/**
 * @param {string} text
 */
cnwdemo.sendText = function(text) {
	if(cw.crosstab.theCrossNamedWindow.isMaster()) {
		cnwdemo.lastDemo.sendTextToSlaves(text);
	} else {
		cnwdemo.lastDemo.sendTextToMaster(text);
	}
};

cnwdemo.start = function() {
	new goog.debug.DivConsole(document.getElementById('log')).setCapturing(true);

	cnwdemo.logger = goog.debug.Logger.getLogger('cnwdemo.logger');
	cnwdemo.logger.setLevel(goog.debug.Logger.Level.ALL);

	cnwdemo.logger.info('Logger works.');

	window.onerror = function(msg, url, lineNumber) {
		cnwdemo.logger.severe('window.onerror: message: ' + cw.repr.repr(msg) +
			'\nURL: ' + url + '\nLine Number: ' + lineNumber)
	};

	cnwdemo.lastDemo = new cnwdemo.Demo();
	cnwdemo.lastDemo.start();
};

goog.exportSymbol('__cnwdemo_start', cnwdemo.start);

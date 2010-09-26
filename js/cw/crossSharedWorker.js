/**
 * @fileoverview The code run inside the SharedWorker by
 * 	{@link cw.crosstab.CrossSharedWorker}.
 *
 * It's okay to use goog.require(...) in this file, because we only load
 * the compiled version in the SharedWorker.
 */

goog.provide('cw.crossSharedWorker');


/**
 * @param {!MessagePort} port
 *
 * @constructor
 */
cw.crossSharedWorker.Client = function(port) {
	/**
	 * @type {number} Unique ID for this client.
	 */
	this.id = ++cw.crossSharedWorker.Client.counter_;

	/**
	 * @type {!MessagePort} port
	 */
	this.port_ = port;

	this.port_.onmessage = goog.bind(this.onMessageFromClient_, this);
};

/**
 * @param {*} data
 * @param {!Array.<!MessagePort>} ports
 */
cw.crossSharedWorker.Client.prototype.onMessageFromClient_ = function(data, ports) {
	if(goog.isArray(data)) {
		if(data[0] == 'dying') {
			var evacuatedData = data[1];
			// XXX DO SOMETHING
		}
	}
};

/**
 * @param {*} e
 */
cw.crossSharedWorker.Client.prototype.sendError = function(e) {
	this.port_.postMessage_(['error_in_worker', e]);
};

/**
 * @param {*} evacuatedData
 */
cw.crossSharedWorker.Client.prototype.becomeMaster = function(evacuatedData) {
	this.port_.postMessage_(['become_master', evacuatedData]);
};

/**
 * @param {!cw.crossSharedWorker.Client} slave
 * @param {!MessagePort} portToSlave
 */
cw.crossSharedWorker.Client.prototype.addSlave = function(slave, portToSlave) {
	this.port_.postMessage_(['add_slave', slave.id], [portToSlave]);
};

/**
 * @param {!cw.crossSharedWorker.Client} slave
 */
cw.crossSharedWorker.Client.prototype.removeSlave = function(slave) {
	this.port_.postMessage_(['remove_slave', slave.id]);
};

/**
 * @param {!cw.crossSharedWorker.Client} master
 * @param {!MessagePort} portToMaster
 */
cw.crossSharedWorker.Client.prototype.becomeSlave = function(master, portToMaster) {
	this.port_.postMessage_(['become_slave', master.id], [portToMaster]);
};

/**
 * @type {number}
 * @private
 */
cw.crossSharedWorker.Client.counter_ = 0;


/**
 * The object that collects clients and decides which should be master.
 * @constructor
 */
cw.crossSharedWorker.Decider = function() {
	/**
	 * @type {!Array.<!cw.crossSharedWorker.Client>}
	 */
	this.clients_ = [];
};

/**
 * A client has connected.
 * @param {!MessagePort} port
 */
cw.crossSharedWorker.Decider.prototype.gotNewPort = function(port) {
	var client = new cw.crossSharedWorker.Client(port);
	this.clients_.push(client);
	if(!this.master_) { // Tell client to become master
		this.master_ = client;
		this.master_.becomeMaster(null);
	} else { // Tell client to become slave
		this.clients_.push(client);
		var channel = new MessageChannel();

		// It is safe to do both postMessages without any waiting/confirmation
		// from one side.  Messages are queued by the browser if the other
		// port hasn't been listened on yet.  I tested by wrapping the
		// second postMessage in a setTimeout(..., 5000).  The message
		// was still received after a delay on Chrome 6.0.472.62 beta and
		// an Opera 10.70 build on 2010-09-22.
		client.becomeSlave(this.master_, /** @type {!MessagePort} */(channel.port1));
		this.master_.addSlave(client, /** @type {!MessagePort} */(channel.port2));
	}
};

/**
 * @param {*} e
 */
cw.crossSharedWorker.Decider.prototype.sendErrorIfPossible = function(e) {
	if(this.clients_.length) {
		this.clients_[0].sendError(e);
	}
};

/**
 * @type {cw.crossSharedWorker.Client}
 * @private
 */
cw.crossSharedWorker.Decider.prototype.master_ = null;



/**
 * @type {!cw.crossSharedWorker.Decider}
 */
cw.crossSharedWorker.theDecider = new cw.crossSharedWorker.Decider();



/**
 * @type {*}
 */
cw.crossSharedWorker.lastError = null;

/**
 * @param {*} e
 */
cw.crossSharedWorker.onErrorHandler = function(e) {
	cw.crossSharedWorker.lastError = e;
	cw.crossSharedWorker.theDecider.sendErrorIfPossible(e);
};

/**
 * @param {*} e
 */
cw.crossSharedWorker.onConnectHandler = function(e) {
	var port = e.ports[0];
	cw.crossSharedWorker.theDecider.gotNewPort(port);
};


goog.exportSymbol('onerror', cw.crossSharedWorker.onErrorHandler);
goog.exportSymbol('onconnect', cw.crossSharedWorker.onConnectHandler);

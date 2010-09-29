/**
 * @fileoverview The code run inside the SharedWorker by
 * 	{@link cw.crosstab.CrossSharedWorker}.
 *
 * It's okay to use goog.require(...) in this file, because we only load
 * the compiled version in the SharedWorker.
 *
 * How this works: clients connect to the SharedWorker, which decides
 * whether a client should be master or slave.  For each slave that
 * connects, it helps creates a direct connection between the master and
 * the slave (messages are *not* proxied through the SharedWorker).
 *
 * A client can announce that it is dying.  If it is master, it can pass some
 * data for argument `evacuatedData`, which is given to the next master.
 */

goog.provide('cw.crossSharedWorker');

goog.require('goog.asserts');
goog.require('cw.repr');


/**
 * @param {!MessagePort} port
 *
 * @constructor
 */
cw.crossSharedWorker.Client = function(decider, port) {
	/**
	 * @type {!cw.crossSharedWorker.Decider}
	 * @private
	 */
	this.decider_ = decider;

	/**
	 * @type {number} Unique ID for this client.
	 */
	this.id = ++cw.crossSharedWorker.Client.counter_;

	/**
	 * @type {!MessagePort} port
	 * @private
	 */
	this.port_ = port;

	this.port_.onmessage = goog.bind(this.onMessageFromClient_, this);
};

/**
 * @param {!Array.<string>} sb
 * @param {!Array.<*>} stack
 */
cw.crossSharedWorker.Client.prototype.__reprToPieces__ = function(sb, stack) {
	sb.push('<Client id=');
	cw.repr.reprToPieces(this.id_, sb, stack);
	sb.push('>');
};

/**
 * @param {!MessageEvent} e
 */
cw.crossSharedWorker.Client.prototype.onMessageFromClient_ = function(e) {
	var data = e.data;
	if(goog.isArray(data)) {
		if(data[0] == 'dying') {
			var evacuatedData = data[1];
			this.decider_.clientDied_(this, evacuatedData);
		}
	}
};

/**
 * @param {*} e
 */
cw.crossSharedWorker.Client.prototype.sendError = function(e) {
	this.port_.postMessage(['error_in_worker', e]);
};

/**
 * @param {*} evacuatedData
 */
cw.crossSharedWorker.Client.prototype.becomeMaster = function(evacuatedData) {
	this.port_.postMessage(['become_master', evacuatedData]);
};

/**
 * @param {!cw.crossSharedWorker.Client} slave
 * @param {!MessagePort} portToSlave
 */
cw.crossSharedWorker.Client.prototype.addSlave = function(slave, portToSlave) {
	this.port_.postMessage(['add_slave', slave.id], [portToSlave]);
};

/**
 * @param {!cw.crossSharedWorker.Client} slave
 */
cw.crossSharedWorker.Client.prototype.removeSlave = function(slave) {
	this.port_.postMessage(['remove_slave', slave.id]);
};

/**
 * @param {!cw.crossSharedWorker.Client} master
 * @param {!MessagePort} portToMaster
 */
cw.crossSharedWorker.Client.prototype.becomeSlave = function(master, portToMaster) {
	this.port_.postMessage(['connect_to_master', master.id], [portToMaster]);
};

/**
 * @type {number}
 * @private
 */
cw.crossSharedWorker.Client.counter_ = 0;


/**
 * The object that collects clients and decides which should be master.
 *
 * @param {function():!Object} messageChannelCtor A function that returns a
 * 	new {@code MessageChannel}.
 * @constructor
 */
cw.crossSharedWorker.Decider = function(messageChannelCtor) {
	/**
	 * @type {function():!Object}
	 * @private
	 */
	this.messageChannelCtor_ = messageChannelCtor;

	/**
	 * @type {!Array.<!cw.crossSharedWorker.Client>}
	 * @private
	 */
	this.clients_ = [];

};

/**
 * @param {!Array.<string>} sb
 * @param {!Array.<*>} stack
 */
cw.crossSharedWorker.Decider.prototype.__reprToPieces__ = function(sb, stack) {
	sb.push('<Decider clients_=');
	cw.repr.reprToPieces(this.clients_, sb, stack);
	sb.push('>');
};

/**
 * @param {!cw.crossSharedWorker.Client} slave
 * @private
 */
cw.crossSharedWorker.Decider.prototype.connectSlave_ = function(slave) {
	var channel = this.messageChannelCtor_();

	// It is safe to do both postMessages without any waiting/confirmation
	// from one side.  Messages are queued by the browser if the other
	// port hasn't been listened on yet.  I tested by wrapping the
	// second postMessage in a setTimeout(..., 5000).  The message
	// was still received after a delay on Chrome 6.0.472.62 beta and
	// an Opera 10.70 build on 2010-09-22.
	slave.becomeSlave(this.master_, /** @type {!MessagePort} */(channel.port1));
	this.master_.addSlave(slave, /** @type {!MessagePort} */(channel.port2));
};

/**
 * A client has connected.
 * @param {!MessagePort} port
 * @private
 */
cw.crossSharedWorker.Decider.prototype.gotNewPort_ = function(port) {
	var client = new cw.crossSharedWorker.Client(this, port);
	this.clients_.push(client);
	if(!this.master_) { // Tell client to become master
		this.master_ = client;
		this.master_.becomeMaster(null);
	} else { // Tell client to become slave
		this.connectSlave_(client);
	}
};

/**
 * @param {!cw.crossSharedWorker.Client} client
 * @param {*} evacuatedData
 * @private
 */
cw.crossSharedWorker.Decider.prototype.clientDied_ = function(client, evacuatedData) {
	var isMaster = this.master_ == client;
	var ret = goog.array.remove(this.clients_, client);
	goog.asserts.assert(ret, "Client " + cw.repr.repr(client) +
		" not removed from clients_?");
	if(!isMaster) {
		this.master_.removeSlave(client);
	} else if(this.clients_.length) {
		this.master_ = this.clients_[0];
		this.master_.becomeMaster(evacuatedData);
		// Connect the slaves to the new master.
		var slaves = this.clients_.slice(1);
		for(var i=0; i < slaves.length; i++) {
			this.connectSlave_(slaves[i]);
		}
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
cw.crossSharedWorker.theDecider = new cw.crossSharedWorker.Decider(
	function() {
		return new MessageChannel();
	}
);



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
	cw.crossSharedWorker.theDecider.gotNewPort_(port);
};


goog.exportSymbol('onerror', cw.crossSharedWorker.onErrorHandler);
goog.exportSymbol('onconnect', cw.crossSharedWorker.onConnectHandler);

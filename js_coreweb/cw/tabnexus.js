/**
 * @fileoverview The code run inside the SharedWorker by
 * 	{@link cw.crosstab.CrossSharedWorker}.
 *
 * This is DEPRECATED and may be removed at any time.  See crosstab.js
 * for an explanation.
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

goog.provide('cw.tabnexus');

goog.require('goog.asserts');
goog.require('cw.repr');


/**
 * @param {!MessagePort} port
 *
 * @constructor
 */
cw.tabnexus.Client = function(decider, port) {
	/**
	 * @type {!cw.tabnexus.Decider}
	 * @private
	 */
	this.decider_ = decider;

	/**
	 * @type {number} Unique ID for this client.
	 */
	this.id = ++cw.tabnexus.Client.counter_;

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
cw.tabnexus.Client.prototype.__reprPush__ = function(sb, stack) {
	sb.push('<Client id=');
	cw.repr.reprPush(this.id, sb, stack);
	sb.push('>');
};

/**
 * @param {!MessageEvent} e
 */
cw.tabnexus.Client.prototype.onMessageFromClient_ = function(e) {
	var data = e.data;
	if(goog.isArray(data)) {
		if(data[0] == 'dying') {
			var evacuatedData = data[1];
			this.port_.close();
			this.decider_.clientDied_(this, evacuatedData);
		}
	}
};

/**
 * @param {*} e
 */
cw.tabnexus.Client.prototype.sendError = function(e) {
	this.port_.postMessage(['error_in_worker', e]);
};

/**
 * @param {*} evacuatedData
 */
cw.tabnexus.Client.prototype.becomeMaster = function(evacuatedData) {
	this.port_.postMessage(['become_master', evacuatedData]);
};

/**
 * @param {!cw.tabnexus.Client} slave
 * @param {!MessagePort} portToSlave
 */
cw.tabnexus.Client.prototype.addSlave = function(slave, portToSlave) {
	this.port_.postMessage(['add_slave', slave.id], [portToSlave]);
};

/**
 * @param {!cw.tabnexus.Client} slave
 */
cw.tabnexus.Client.prototype.removeSlave = function(slave) {
	this.port_.postMessage(['remove_slave', slave.id]);
};

/**
 * @param {!cw.tabnexus.Client} master
 * @param {!MessagePort} portToMaster
 */
cw.tabnexus.Client.prototype.becomeSlave = function(master, portToMaster) {
	this.port_.postMessage(['connect_to_master', master.id], [portToMaster]);
};

/**
 * @type {number}
 * @private
 */
cw.tabnexus.Client.counter_ = 0;


/**
 * The object that collects clients and decides which should be master.
 *
 * @param {function():!Object} messageChannelCtor A function that returns a
 * 	new {@code MessageChannel}.
 * @constructor
 */
cw.tabnexus.Decider = function(messageChannelCtor) {
	/**
	 * @type {function():!Object}
	 * @private
	 */
	this.messageChannelCtor_ = messageChannelCtor;

	/**
	 * @type {!Array.<!cw.tabnexus.Client>}
	 * @private
	 */
	this.clients_ = [];

};

/**
 * @param {!Array.<string>} sb
 * @param {!Array.<*>} stack
 */
cw.tabnexus.Decider.prototype.__reprPush__ = function(sb, stack) {
	sb.push('<Decider clients_=');
	cw.repr.reprPush(this.clients_, sb, stack);
	sb.push('>');
};

/**
 * @param {!cw.tabnexus.Client} slave
 * @private
 */
cw.tabnexus.Decider.prototype.connectSlave_ = function(slave) {
	var channel = this.messageChannelCtor_();

	if(!this.master_) {
		// I don't think this can ever happen, but Compiler is not that smart.
		throw Error("connectSlave_: No master_?");
	}
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
cw.tabnexus.Decider.prototype.gotNewPort_ = function(port) {
	var client = new cw.tabnexus.Client(this, port);
	this.clients_.push(client);
	if(!this.master_) { // Tell client to become master
		this.master_ = client;
		this.master_.becomeMaster(null);
	} else { // Tell client to become slave
		this.connectSlave_(client);
	}
};

/**
 * @param {!cw.tabnexus.Client} client
 * @param {*} evacuatedData
 * @private
 */
cw.tabnexus.Decider.prototype.clientDied_ = function(client, evacuatedData) {
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
cw.tabnexus.Decider.prototype.sendErrorIfPossible = function(e) {
	if(this.clients_.length) {
		this.clients_[0].sendError(e);
	}
};

/**
 * @type {cw.tabnexus.Client}
 * @private
 */
cw.tabnexus.Decider.prototype.master_ = null;



/**
 * @type {!cw.tabnexus.Decider}
 */
cw.tabnexus.theDecider = new cw.tabnexus.Decider(
	function() {
		return new MessageChannel();
	}
);



/**
 * @type {*}
 */
cw.tabnexus.lastError = null;

/**
 * @param {*} e
 */
cw.tabnexus.onErrorHandler = function(e) {
	cw.tabnexus.lastError = e;
	cw.tabnexus.theDecider.sendErrorIfPossible(e);
};

/**
 * @param {*} e
 */
cw.tabnexus.onConnectHandler = function(e) {
	var port = e.ports[0];
	cw.tabnexus.theDecider.gotNewPort_(port);
};

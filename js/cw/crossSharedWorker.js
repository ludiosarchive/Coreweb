/**
 * @fileoverview The code run inside the SharedWorker by
 * 	{@link cw.crosstab.CrossSharedWorker}.
 *
 * It's okay to use goog.require(...) in this file, because we only load
 * the compiled version in the SharedWorker.
 */

goog.provide('cw.crossSharedWorker');

cw.crossSharedWorker.clients = [];
cw.crossSharedWorker.master = null;

/**
 * @param {!MessagePort} port
 *
 * @constructor
 */
cw.crossSharedWorker.Client = function(port) {
	/**
	 * @type {!MessagePort} port
	 */
	this.port_ = port;

	/**
	 * @type {number} Unique ID for this client.
	 */
	this.id = ++Client.counter_;
};

/**
 * @type {*} message
 */
cw.crossSharedWorker.Client.prototype.postMessage = function(message) {
	this.port_.postMessage(message);
};

/**
 * @type {number}
 * @private
 */
cw.crossSharedWorker.Client.counter_ = 0;


// Note: cannot prefix with 'var '!
onerror = function(e) {
	master.postMessage('Error in worker: ' + e);
};

onconnect = function(e) {
	var port = e.ports[0];
	var client = new Client(port);
	cw.crossSharedWorker.clients.push(client);
	if(!master) {
		master = port;
		port.postMessage('umaster');
	} else {
		slaves.push(port);
		var channel = new MessageChannel();

		// It is safe to do both postMessages without any waiting/confirmation
		// from one side.  Messages are queued by the browser if the other
		// port hasn't been listened on yet.  I tested by wrapping the
		// second postMessage in a setTimeout(..., 5000).  The message
		// was still received after a delay on Chrome 6.0.472.62 beta and
		// an Opera 10.70 build on 2010-09-22.
		port.postMessage('port2master', [channel.port1]);
		master.postMessage('port2slave', [channel.port2]);
	}
};

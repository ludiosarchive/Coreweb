/**
 * @fileoverview Tests for cw.crossSharedWorker
 */

goog.provide('cw.Test.TestCrossSharedWorker');

goog.require('cw.UnitTest');
goog.require('cw.eq');
goog.require('cw.crossSharedWorker');


// anti-clobbering for JScript; aliases
(function(){

/**
 * @constructor
 */
cw.Test.TestCrossSharedWorker.DummyMessagePort = function() {

};

/**
 * @constructor
 */
cw.Test.TestCrossSharedWorker.DummyMessagePort.prototype.receiveMessage_ = function(message, ports) {
	// TODO: buffer data if no `onmessage` yet.
	var event = cw.eq.plainObject({'data': message});
	if(ports && ports.length) {
		event['ports'] = ports;
	}
	this.onmessage(event);
};

/**
 * @constructor
 */
cw.Test.TestCrossSharedWorker.DummyMessagePort.prototype.postMessage = function(message, ports) {
	this.peer_.receiveMessage_(message, ports);
};



/**
 * @constructor
 */
cw.Test.TestCrossSharedWorker.DummyMessageChannel = function() {
	this.port1 = new cw.Test.TestCrossSharedWorker.DummyMessagePort();
	this.port2 = new cw.Test.TestCrossSharedWorker.DummyMessagePort();
	this.port1.peer_ = this.port2;
	this.port2.peer_ = this.port1;
};



var DummyMessagePort = cw.Test.TestCrossSharedWorker.DummyMessagePort;
var DummyMessageChannel = cw.Test.TestCrossSharedWorker.DummyMessageChannel;

var newDummyMessageChannel = function() {
	return new DummyMessageChannel();
};

var onMessageRecorder = function(log) {
	return function(event) {
		log.push(event);
	};
};


cw.UnitTest.TestCase.subclass(cw.Test.TestCrossSharedWorker, 'TestDecider').methods(

	function test_firstClientBecomesMaster(self) {
		var decider = new cw.crossSharedWorker.Decider();
		var workerChannel = new DummyMessageChannel();
		var log = [];
		workerChannel.port1.onmessage = onMessageRecorder(log);
		decider.gotNewPort_(workerChannel.port2, newDummyMessageChannel);

		self.assertEqual([
			cw.eq.plainObject({'data': ['become_master', null]})
		], log);
	}

);

})(); // end anti-clobbering for JScript

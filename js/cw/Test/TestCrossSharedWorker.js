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


var DummyMessageChannelWithLoggedPort1 = function() {
	var channel = new DummyMessageChannel();
	channel.port1log = [];
	channel.port1.onmessage = onMessageRecorder(channel.port1log);
	return channel;
};


cw.UnitTest.TestCase.subclass(cw.Test.TestCrossSharedWorker, 'TestDecider').methods(

	function test_firstClientBecomesMaster(self) {
		var decider = new cw.crossSharedWorker.Decider();

		// The first client to connect gets a 'become_master' message.
		var channel0 = DummyMessageChannelWithLoggedPort1();
		decider.gotNewPort_(channel0.port2, newDummyMessageChannel);
		self.assertEqual([
			cw.eq.plainObject({'data': ['become_master', null]})
		], channel0.port1log);

		// The second and third clients to connect get a 'become_slave' message.
		var channel1 = DummyMessageChannelWithLoggedPort1();
		decider.gotNewPort_(channel1.port2, newDummyMessageChannel);
		self.assertEqual(1, channel1.port1log.length);
		self.assertEqual(['become_slave', 1/*master.id*/], channel1.port1log[0].data);
		self.assertEqual(1, channel1.port1log[0].ports.length);

		var channel2 = DummyMessageChannelWithLoggedPort1();
		decider.gotNewPort_(channel2.port2, newDummyMessageChannel);
		self.assertEqual(1, channel2.port1log.length);
		self.assertEqual(['become_slave', 1/*master.id*/], channel2.port1log[0].data);
		self.assertEqual(1, channel2.port1log[0].ports.length);
	}

);

})(); // end anti-clobbering for JScript

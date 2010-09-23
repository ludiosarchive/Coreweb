// Note: cannot prefix with 'var '!

var slaves = [];
var master = null;

onerror = function(e) {
	master.postMessage('Error in worker: ' + e);
};

onconnect = function(e) {
	var port = e.ports[0];
	if(!master) {
		master = port;
		port.postMessage('You are the master');
	} else {
		slaves.push(port);
		var channel = new MessageChannel();
		// TODO: is it safe to send them at the same time?
		port.postMessage('Port for slave to master:', [channel.port1]);
		master.postMessage('Port for master to slave:', [channel.port2]);
	}
};

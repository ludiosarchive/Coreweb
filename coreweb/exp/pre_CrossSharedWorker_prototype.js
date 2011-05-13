var slaves = [];
var master = null;

// Note: cannot prefix with 'var '!
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

		// It is safe to do both postMessages without any waiting/confirmation
		// from one side.  Messages are queued by the browser if the other
		// port hasn't been listened on yet.  I tested by wrapping the
		// second postMessage in a setTimeout(..., 5000).  The message
		// was still received after a delay on Chrome 6.0.472.62 beta and
		// an Opera 10.70 build on 2010-09-22.
		port.postMessage('Port for slave to master:', [channel.port1]);
		master.postMessage('Port for master to slave:', [channel.port2]);
	}
};

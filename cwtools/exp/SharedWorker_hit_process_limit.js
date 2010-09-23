var clients = 0;

onconnect = function(e) {
	var port = e.ports[0];
	port.postMessage('Hello, client #' + (++clients));
};

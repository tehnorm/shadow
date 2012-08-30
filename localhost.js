var net = require('net');
var http = require('http');

var remoteParams = {
	'host' : 'localhost',
	'port' : 5555
};

var localParams = {
	'host' : 'snaap.localhost',
	'port' : 80
};

// Connect to the proxy
var remotePipe = net.connect(remoteParams, function() {
	console.log('remotePipe connected');
	remotePipe.write('world!\r\n');
});
remotePipe.on('data', function(data) {
	console.log(data.toString());
	remotePipe.end();
});
remotePipe.on('end', function() {
	console.log('remotePipe disconnected');
});

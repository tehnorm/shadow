var net = require('net');
var http = require('http');

var remoteParams = {
	'host' : '192.168.4.86',
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
	console.log('[remote] got request');
	console.log(data.toString());

	try {
		data = JSON.parse(data.toString());
	} catch(e){
		console.log('[remote] invalid request');
		var resp = {
			'statusCode' : 404,
			'body' : 'remotePipe could not parse request'
		};

		console.log(resp);
		var buff = new Buffer(JSON.stringify(resp));
		remotePipe.write(buff);
		return;
	}

	data.port = localParams.port;
	data.host = localParams.host;
	data.path = data.url;

	// Make a http request to the local http server
	console.log('[remote] making request');
	console.log(data);
	var request = http.request(data, function(response){

		response.on('data', function(chunk){
console.log('[local] chunk');
console.log(chunk);

		});
	});

	request.on('error', function(e){
		console.log('[local] error');
		console.log(e);
		var resp = {
			'statusCode' : 404,
			'body' : 'remotePipe local request error'
		};

		console.log(resp);
		var buff = new Buffer(JSON.stringify(resp));
		remotePipe.write(buff);
	});


//	remotePipe.end();
});
remotePipe.on('end', function() {
	console.log('remotePipe disconnected');
});

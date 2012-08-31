var net = require('net');
var http = require('http');

var remoteParams = {
	'host' : '127.0.0.1',
	'port' : 7123 
};

var localParams = {
	'host' : 'snaap.localhost',
	'port' : 80
};

verbose = false;
var debug = function(){
	var args = Array.prototype.slice.call(arguments);  
	console.log(args[0]);
	if(verbose){
		console.log(args.slice(1));
	}
}

// Connect to the proxy
var remotePipe = net.connect(remoteParams, function() {
	debug('remotePipe connected');
});
remotePipe.setKeepAlive(true);
remotePipe.on('data', function(data) {
	debug('[remote] got request', data.toString());

	try {
		data = JSON.parse(data.toString());
	} catch(e){
		debug('[remote] invalid request');
		debug(data.toString());
		var resp = {
			'statusCode' : 404,
			'body' : 'remotePipe could not parse request'
		};

		debug('[remote] resp:', resp);
		var buff = new Buffer(JSON.stringify(resp));
		remotePipe.write(buff);
		return;
	}

	data.port         = localParams.port;
	data.host         = localParams.host;
	data.path         = data.url;
	data.headers.host = localParams.host+':'+localParams.port;

	// Make a http request to the local http server
	debug('[remote] making request: '+data.headers.host+data.url, data);
	var request = http.request(data, function(response){
		response.once('data', function(chunk){
			debug('[local] chunk', chunk);
			debug('[local] chunk string size:' + chunk.toString().length);
			debug('[local] chunk buffer size:' + chunk.length);
console.log(chunk);
			var resp = {
				'statusCode' : response.statusCode,
				'body' : chunk.toString('base64'),
				'headers' : response.headers
			};
			var buff = new Buffer(JSON.stringify(resp));
			remotePipe.write(buff);
		});
	});


	request.on('error', function(e){
		debug('[local] error', e);
		var resp = {
			'statusCode' : 404,
			'body' : 'remotePipe local request error'
		};

		debug('[local] error resp', resp);
		var buff = new Buffer(JSON.stringify(resp));
		remotePipe.write(buff);
	});

	request.end();


//	remotePipe.end();
});
remotePipe.on('end', function() {
	debug('remotePipe disconnected');
});

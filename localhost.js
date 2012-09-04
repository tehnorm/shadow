var net = require('net');
var http = require('http');
var dnode = require('dnode');


var remoteParams = {
	'host' : '127.0.0.1',
	'port' : 7123 
};

var localParams = {
	'host' : 'snaap.localhost',
	'port' : 80
};

// Connect to the proxy
var d = dnode(function(remote, conn){ 
	this.proxyRequest = function(req, res, body, connected, gotData, gotError, gotEnd){
		var data = {
			'host' : localParams.host,
			'port' : localParams.port,
			'path' : req.url,
			'headers' : req.headers,
			'method' : req.method
		};
		data.headers.host = localParams.host+':'+localParams.port;

		var handle = req.method+": "+data.headers.host+req.url;

		var request = http.request(data, function(response){
			console.log('poxy request completed: '+handle);
			response.on('data', function(chunk){
				console.log('data['+chunk.length+'] '+handle);
				gotData(chunk.toString('base64'));
			});
			response.on('end', gotEnd);

			connected(request, response);
		});

		request.on('error', gotError);
		if(req.method != 'GET'){
			request.write(body);
		}
		request.end();
	};

}).connect(remoteParams.host, remoteParams.port);

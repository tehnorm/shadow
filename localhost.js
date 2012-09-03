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
	data = data.toString();
	debug('[remote] got request', data);
	d = data.split("\r\n");

	for(i=0; i<d.length; i++){
		data = d[i];
		if(data.length < 1){
			continue;
		}
		try {
			data = JSON.parse(data);
		} catch(e){
			debug('[remote] invalid request');
			debug(data);
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

		debug('[remote] request: ' + data.url);

		// Make a http request to the local http server
		debug('[remote] making request: '+data.headers.host+data.url, data);
		var request = http.request(data, function(response){
			var seq = this.seq;
			response.on('data', function(chunk){
				debug('[local] chunk', chunk);
				debug('[local] chunk string size:' + chunk.toString().length);
				debug('[local] chunk buffer size:' + chunk.length);
				var resp = {
					'statusCode' : response.statusCode,
					'body' : chunk.toString('base64'),
					'headers' : response.headers,
					'seq' : seq
				};
				var buff = new Buffer(JSON.stringify(resp));
				var flushed = remotePipe.write(buff+"\r\n");
				if(!flushed){
					remotePipe.pause();
				}
			});
		});
		request.seq = data.seq;

		request.on('error', function(e){
			debug('[local] fucking error', e);
			debug(e);
			var resp = {
				'statusCode' : 404,
				'body' : 'remotePipe local request error',
				'seq' : this.seq
			};

			debug('[local] error resp', resp);
			var buff = new Buffer(JSON.stringify(resp));
			remotePipe.write(buff);
		});

		request.end();
	}

//	remotePipe.end();
});
remotePipe.on('end', function() {
	debug('remotePipe disconnected');
});
remotePipe.on('drain', function() {
	debug('remotePipe drain');
	remotePipe.resume();
});

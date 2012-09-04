var net = require('net');
var http = require('http');
var dnode = require('dnode');

// WEB SERVER
var external = http.createServer();
external.setMaxListeners(0);
external.listen(7777, function(){
	console.log('[external] listen');
});

// DNODE
var server = dnode(function(remote, conn){
	conn.on('ready', function() {
		console.log('client ready');
		external.on('request', function (req, res) {
			var body = '';

			req.on('data', function(chunk){
				body += chunk;
			});
			
			req.on('end', function(){
				console.log('http request ['+req.method+'] '+req.url);
				console.log('end');
				var connected = function(localReq, localRes){
					res.writeHead(localRes.statusCode, localRes.headers);
				};

				var data = function(chunk){
					console.log('data ['+chunk.length+'] '+req.url);
					res.write(new Buffer(chunk, 'base64'));
				};

				var error = function(){
					console.log('got error:' + req.url);
					res.end();
				};

				var end = function(){
					res.end();
				};

				remote.proxyRequest(req, res, body, connected, data, error, end);
			});
		});
	});
}).listen(7123);

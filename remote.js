var net = require('net');
var http = require('http');
/*
 *  REQUEST   [ external request ] -> [ http server ] -> [ socket ] -> [ local socket ] -> [ request to localhost ]
 *  RESPONSE  [ localhost response ] -> [ local socket ] -> [ socket ] -> [ http response ] 
 */
	


var localPipe = net.createServer(function(c) { //'connection' listener
	console.log('[localPipe] connected');
	c.on('end', function() {
		console.log('[localPipe] disconnected');
		external.close();
	});
//	c.write('hello\r\n');
//	c.pipe(c);

	// Only create the http server if we have a local connection
	var external = http.createServer(function (req, res) {
		console.log('[external] incomming request');


		// Setup the callback for data responses
		c.on('data', function(data){
			console.log('[localPipe] data');
			console.log(data.toString());
			data = JSON.parse(data.toString());
			res.statusCode = data.statusCode;
			res.write(data.body);
			res.end();
		});

		var cerial = {
			'headers' : req.headers,
			'url' : req.url,
			'method' : req.method,
			'statusCode' : req.statusCode
		};
		console.log('[external] request');
		console.log(cerial);

		var buff = new Buffer(JSON.stringify(cerial));

		// Make the request to the pipe
		c.write(buff);	
	});

	external.listen(7777, function(){
		console.log('[external] listen');
	});

});

localPipe.listen(5555, function() { //'listening' listener
	console.log('[localPipe] bound');
});




console.log('up');

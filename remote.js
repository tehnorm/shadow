var net = require('net');
var http = require('http');

verbose = false;
var debug = function(){
        var args = Array.prototype.slice.call(arguments);
        console.log(args[0]);
        if(verbose){
                console.log(args.slice(1));
        }
}




/*
 *  REQUEST   [ external request ] -> [ http server ] -> [ socket ] -> [ local socket ] -> [ request to localhost ]
 *  RESPONSE  [ localhost response ] -> [ local socket ] -> [ socket ] -> [ http response ] 
 */
	


var localPipe = net.createServer(function(c) { //'connection' listener
	debug('[localPipe] connected');
	c.setMaxListeners(0);
	c.setKeepAlive(true);

	c.once('drain', function(data) {
		debug('[localPipe] drain - write buffer empty');
	});

	// Only create the http server if we have a local connection
	var external = http.createServer(function (req, res) {
		debug('[external] incomming request');

		// Setup the callback for data responses
		c.once('data', function(data){
			data = data.toString();
			debug('[localPipe] data', data);
			debug(data);
			var d = data.split("\r\n"); 
			for (i=0; i<d.length; i++) {
				var data = d[i];
				if(data.length < 1){
					continue;
				}
debug(data);
				try {
				data = JSON.parse(data);
				} catch (e){
debug(e);
				res.end();
continue;
				}
				res.writeHead(data.statusCode, data.headers);
				debug('[localPipe] body string size: '+ data.body.length);
				debug('[localPipe] body string: '+ data.body);
				res.write(new Buffer(data.body, 'base64'));
				res.end();
			}
		});

		c.once('end', function() {
			debug('[localPipe] socket is ending');
			external.close();
		});


		var cerial = {
			'headers' : req.headers,
			'url' : req.url,
			'method' : req.method,
			'statusCode' : req.statusCode
		};
		debug('[external] request:' + req.url, cerial);
		debug(cerial);

		// Make the request to the pipe
		var buff = new Buffer(JSON.stringify(cerial));
		c.write(buff+"\r\n");	
	});

	external.setMaxListeners(0);

	external.listen(7777, function(){
		debug('[external] listen');
	});

});


localPipe.listen(7123, function() { //'listening' listener
	debug('[localPipe] bound');
});




debug('up');

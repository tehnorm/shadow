var net = require('net');
var http = require('http');

var verbose = false;
var seq = 0;
var queue = new Array();
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
		c.resume();
	});

	// Only create the http server if we have a local connection
	var external = http.createServer(function (req, res) {
		queue[seq] = {
			'req' : req,
			'res' : res
		};

		// Setup the callback for data responses
		c.once('data', function(data){
			debug('[localPipe] buffer size:  ' + data.length);
			data = data.toString();
			debug('[localPipe] data', data);
			debug('[localPipe] bytesRead ' + c.bytesRead);
			debug('[localPipe] data size' + data.length);
			debug(data);
			var d = data.split("\r\n"); 
			for (i=0; i<d.length; i++) {
				var data = d[i];
				if(data.length < 1){
					continue;
				}
				try {
					data = JSON.parse(data);
				} catch (e){
					debug(e);
		//			debug(data);
					continue;
				}

				if(queue[data.seq] !== false){
					var r = queue[data.seq].res;
					r.writeHead(data.statusCode, data.headers);
					// debug('[localPipe] body string size: '+ data.body.length);
					// debug('[localPipe] body string: '+ data.body);
					r.write(new Buffer(data.body, 'base64'));
					r.end();
					
				}
			}
		});

		c.once('end', function() {
			debug('[localPipe] socket is ending');
			external.close();
		});


		var cerial = {
			'seq' : seq,
			'headers' : req.headers,
			'url' : req.url,
			'method' : req.method,
			'statusCode' : req.statusCode
		};
		debug('[external] request:' + req.url, cerial);
		// debug(cerial);

		// Make the request to the pipe
		var buff = new Buffer(JSON.stringify(cerial));
		var flushed = c.write(buff+"\r\n");
		if(!flushed){
			c.pause();
		}
		seq++;	
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

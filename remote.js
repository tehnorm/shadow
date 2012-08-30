var net = require('net');
var http = require('http');
var localPipeConnected = false;
/*
 *  REQUEST   [ external request ] -> [ http server ] -> [ socket ] -> [ local socket ] -> [ request to localhost ]
 *  RESPONSE  [ localhost response ] -> [ local socket ] -> [ socket ] -> [ http response ] 
 */
	


var localPipe = net.createServer(function(c) { //'connection' listener
	console.log('localPipe connected');
	localPipeConnected = true;
	c.on('end', function() {
		localPipeConnected = false;
		console.log('localPipe disconnected');
	});
	c.write('hello\r\n');
	c.pipe(c);
});

localPipe.listen(5555, function() { //'listening' listener
	console.log('localPipe bound');
});





var external = http.createServer(function (req, res) {
	console.log('in comming connection');
	if(!localPipeConnected){
		res.writeHead(404, {'Content-Type': 'text/plain'});
		res.end('localPipe note connected');
	}
});

/*
external.on('connect', function(request, socket, head){
});
*/
/*
external.listen('request', function(request, response){
	console.log('in comming request');
	if(!localPipeConnected){
		response.writeHead(404, 'localPipe not connected');
		response.end();
		return
	}
});
*/
external.listen(7777, function(){
console.log('listen');

});
console.log('up');

# What is Shadow?

Shadow is meant to be a reverse proxy much like localtunnel.com but you can run it on your own hardware.

# Usage

Deploy the repo to a external server. 

node remote.js

This will start webserver on port 7777 for incoming external requests.


On your local machine edit localhost.js and change remoteParams and localParams objects to contain proper config values. 

node localhost.js

Once the tunnel is connected traffic from your <remote host>:7777 will be proxied to your localhost web server.

const SERVER_HOST = '192.168.1.3';//'192.168.1.200';
const SERVER_PORT = 80;
const GATEWAY_HOST = '192.168.1.3';
const GATEWAY_PORT = 3000;
const { default: axios } = require('axios');
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end();//res.send('Hello World!');
});

app.get('/hb', (req, res) => {
	res.setHeader('Content-Type', 'text/plain'); //application/json
	res.end();
});

app.listen(SERVER_PORT, SERVER_HOST, () => {
	console.log(`Microservice listening at http://${SERVER_HOST}:${SERVER_PORT}`);
	axios.get("http://" + GATEWAY_HOST + ":" + GATEWAY_PORT + "/register")
		.then((res) => console.log(`Registered to gateway http://${GATEWAY_HOST}:${GATEWAY_PORT}`))
		.catch((err) => {
			console.log(`Error while registering to gateway: ${err.code} - ${err.address}`);
			process.exit(1);
		});
	
});
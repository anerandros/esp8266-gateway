const SERVER_PORT = 3000;
const SERVER_HOST = '192.168.1.3'//'192.168.1.200';
const axios = require('axios').default;
const express = require('express');
const app = express();

//{ip, connectionTime, lastConnectionTime, toBalcony}
var MICROSERVICE_LIST = [];
var workingMS = [];
const MICROSERVICE_HB_CHECK = 60*1000; // 1 min

app.on('error', function(err) {
  console.log("------>", err);
});

app.get('/', (req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end();//res.send('Hello World!');
});

app.get('/register', (req, res) => {
  const ip = req.connection.remoteAddress;
  const connectionTime = Math.floor(Date.now() / 1000);
  const lastConnectionTime = connectionTime;
  const toBalcony = 1;
  const microObj = {ip, connectionTime, lastConnectionTime, toBalcony}
  MICROSERVICE_LIST.push(microObj);
  console.log(microObj);
  res.send('Added');
});

app.get('/list', (req, res) => {
  res.send(MICROSERVICE_LIST);
});

app.listen(SERVER_PORT, SERVER_HOST, () => {
  console.log(`Gateway app listening at http://${SERVER_HOST}:${SERVER_PORT}`);
  attachHeartBeatKo();
});


function attachHeartBeatKo() {
  setInterval(() => {
    workingMS = [];
    console.log("Calling hb check");
    MICROSERVICE_LIST.forEach(currMS => {
      axios.get("http://" + currMS.ip + '/hb')
        .then(function (response) {
          currMS.lastConnectionTime = Math.floor(Date.now() / 1000);
          console.log(currMS.ip + " is still alive");
          console.log(currMS);
          workingMS.push(currMS);
        })
        .catch(function (error) {
          console.log(currMS.ip + " detached from gateway");
        })
      MICROSERVICE_LIST = workingMS;
    });
  }, MICROSERVICE_HB_CHECK);
}
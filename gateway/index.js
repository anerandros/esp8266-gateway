const SERVER_PORT = 3000;
const SERVER_HOST = '192.168.1.3'//'192.168.1.200';
const axios = require('axios').default;
const express = require('express');
const app = express();

//{ip, connectionTime, lastConnectionTime, toBalcony}
var MICROSERVICE_LIST = [];
var workingMS = [];
const MICROSERVICE_HB_CHECK = 60*1000; // 1 min

var MS_DETACHED_LIST = [];
const MICROSERVICE_RESUME_CHECK = 2*60*1000; // 2 min

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
  if (MICROSERVICE_LIST.filter(currMS => currMS.ip === ip).length > 0) {
    console.log(currMS.ip + " is trying to connect again")
    res.end();
  } else {
    MICROSERVICE_LIST.push(microObj);
    console.log(microObj);
    res.send('Added');
  }
});

app.get('/list', (req, res) => {
  res.send(MICROSERVICE_LIST);
});

app.get('/ko', (req, res) => {
  res.send(MS_DETACHED_LIST);
});

app.listen(SERVER_PORT, SERVER_HOST, () => {
  console.log(`Gateway app listening at http://${SERVER_HOST}:${SERVER_PORT}`);
  attachKoResumer(onHbSuccess, onHbError);
  attachHeartBeat(onHbSuccess, onHbError);
});

/**
 function attachHeartBeat(onSuccess, onError) {
  setInterval(() => {
    workingMS = [];
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
          // retryConnection(currMS);
        });
      MICROSERVICE_LIST = workingMS;
    });
  }, MICROSERVICE_HB_CHECK);
}
 */

function attachHeartBeat(onSuccess, onError) {
  setInterval(() => {
    workingMS = [];
    MICROSERVICE_LIST.forEach(currMS => registerMS(onSuccess, onError, currMS, workingMS));
    MICROSERVICE_LIST = workingMS;
  }, MICROSERVICE_HB_CHECK);
}

function registerMS(onSuccess, onError, currMS, workingMS) {
  axios.get("http://" + currMS.ip + '/hb')
    .then(() => onSuccess(currMS, workingMS))
    .catch(() => onError(currMS));
}

function onHbSuccess(currMS, workingMS) {
  currMS.lastConnectionTime = Math.floor(Date.now() / 1000);
  console.log(currMS.ip + " is alive");
  console.log(currMS);
  workingMS.push(currMS);
}

function onHbError(currMS) {
  console.log(currMS.ip + " detached from gateway. Trying to force connection...");
  if (MS_DETACHED_LIST.filter(currMicroService => currMicroService.ip === currMS.ip).length === 0) {
    MS_DETACHED_LIST.push(currMS);
  }
}

function attachKoResumer(onSuccess, onError) {
  setInterval(() => {
    workingMS = [];
    MS_DETACHED_LIST.forEach(currMS => registerMS(onSuccess, onError, currMS, workingMS));
    workingMS.length && addMSToList(workingMS);
  }, MICROSERVICE_RESUME_CHECK);
}

function addMSToList(workingMS) {
  workingMS.forEach(currMS => {
    if (!isInArray(MICROSERVICE_LIST, currMS, 'ip')) {
      MICROSERVICE_LIST.push(currMS);
      MS_DETACHED_LIST = MS_DETACHED_LIST.filter(MS => MS.ip !== currMS.ip);
    }
  })
}

var isInArray = function(array, object, attr) {
  return array.filter(el => {
    return el[attr] == object[attr];
  }).length > 0;
}
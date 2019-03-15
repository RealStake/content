//Global variables
var el = (q) => document.querySelector(q);
var consoleLogger = [];
var MAX_LOG_LINE = 32;
var CONSOLE_TEXT_HEIGHT = 21;
var instanceCI = null;
var eventHandler = null;

//Text padding
function pand(val, len) {
  return `${val}${(' ').repeat(len - val.length)}`;
}

var addEvent = function (object, type, callback) {
  if (object == null || typeof (object) == 'undefined') return;
  if (object.addEventListener) {
    object.addEventListener(type, callback, false);
  } else if (object.attachEvent) {
    object.attachEvent("on" + type, callback);
  } else {
    object["on" + type] = callback;
  }
};

function isFloat(n) {
  return Number(n) === n && n % 1 !== 0;
}

function printNum(x, round) {
  round = round || 3;
  return (isFloat(x) ? x.toFixed(round) : x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

var strty = (v) => JSON.stringify(v, null, null);

//Logging
var logger = {
  error: function (message) {
    logger.log(`<span style="color:red;">${message}</span>`);
  },
  warn: function (message) {
    logger.log(`<span style="color:yellow;">${message}</span>`);
  },
  info: function (message) {
    logger.log(`<span style="color:cyan;">${message}</span>`);
  },
  log: function (message) {
    consoleLogger.push(`${(new Date()).toLocaleString()}|${message}`);
    if (consoleLogger.length > MAX_LOG_LINE) {
      consoleLogger.splice(0, consoleLogger.length - MAX_LOG_LINE);
    }
    el('pre#log').innerHTML = consoleLogger.join('\n');
  }
}

addEvent(window, 'load', function () {
  MAX_LOG_LINE = el('pre#log').clientHeight / CONSOLE_TEXT_HEIGHT;
});

addEvent(window, 'resize', function () {
  MAX_LOG_LINE = el('pre#log').clientHeight / CONSOLE_TEXT_HEIGHT;
});

function connectWallet(callback) {
  (async function () {

    let selectedNet = localStorage.getItem('selected-network');
    if (selectedNet) {
      el('#selectNetwork').value = selectedNet;
    }

    el('#selectNetwork').addEventListener('change', function () {
      localStorage.setItem('selected-network', this.value);
      location.reload();
    }, false);
    
    selectedNet = selectedNet || 'rinkeby-develop';

    //Create new interface of contract for rinkeby-develop
    instanceCI = ContractInterface(selectedNet);
    if (typeof instanceCI.executed === 'undefined') instanceCI.executed = false;

    //Global event handler
    eventHandler = instanceCI.noQueue;

    //Handle Metamask's connect status
    eventHandler.on('metamask-update', (data) => {
      logger.info(`Metamask is ${data.connectStatus ? 'connected' : 'disconnected'}`);
      el('#buttonConnectWallet').disabled = data.connectStatus;
    });

    //Connect wallet
    let accounts = await instanceCI.connect();
    if (instanceCI.connected) {
      logger.info(`Accounts:  ${accounts} network (${selectedNet})`);
      //Request for Ethereum balance
      let balance = instanceCI.utils.toBN(await instanceCI.getBalance(instanceCI.defaultAccount));
      if (balance) {
        logger.info(`Balance in wei: ${balance.div(instanceCI.utils.toBN('1000000000000000000')).valueOf()} ETH`);
      }
    }

    //Onetime trigger
    if (!instanceCI.executed && instanceCI.connected) {
      callback();
      instanceCI.executed = true;
    }
  })();
}
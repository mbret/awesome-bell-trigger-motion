const socketClient = require("socket.io-client");
const Gpio = require('onoff').Gpio;
const config = require("./config");
const _ = require("lodash");
try { _.merge(config, require("./config.local")); } catch (err) {}
let blink = null;
let connected = false;
let led = new Gpio(config.ledPin, 'out');

blinkLed(led, 1000);

process.on('SIGINT', function () {
    led.unexport();
});

console.log("connecting to %s", config.server);
let socket = socketClient(config.server, {
    timeout: 1000
});

socket
    .on("reconnect", reconnect)
    .on("connect_error", connect_error)
    .on("reconnect_error", reconnect_error)
    .on("reconnect_failed", reconnect_failed)
    .on("reconnect_attempt", reconnect_attempt)
    .on("reconnecting", reconnecting)
    .on("error", error)
    .on('connect', connect)
    .on('unauthorized', unauthorized)
    .on("disconnect", disconnect)
    .on("authenticated", function() {
        console.log('authenticated');
        connected = true;
        clearInterval(blink);
        // blink 3 times and then set permanent on
        blinkLed(led, 100);
        setTimeout(function() {
            if (connected) {
                clearInterval(blink);
                led.writeSync(1);
            }
        }, 400);
    });

function connect_error(err) {
    console.error("connect_error", err);
}

function reconnect_error() {
    console.error("reconnect_error");
}

function reconnect_failed() {
    console.error("reconnect_failed");
}

function reconnect_attempt() {
    console.error("reconnect_attempt");
}

function reconnect() {
    console.error("reconnect");
}

function error() {
    console.error("error");
}

function reconnecting() {
    console.log("reconnecting");
}

function disconnect() {
    console.log("disconnect");
    connected = false;
    blinkLed(led, 1000);
}

function unauthorized(msg) {
    console.log("unauthorized: " + JSON.stringify(msg.data));
}

function connect() {
    console.log('connect');
    console.log("authenticate");
    socket.emit("authenticate", {token: config.authToken})
}

function blinkLed(led, ms) {
    clearInterval(blink);
    blink = setInterval(function() {
        led.writeSync(led.readSync() ^ 1); // 1 = on, 0 = off :)
    }, ms);
}
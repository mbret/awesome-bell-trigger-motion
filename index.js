const socketClient = require("socket.io-client");
const Gpio = require('onoff').Gpio;
var request = require('request');
// var raspi = require('raspi-io');
// var five = require('johnny-five');
// var board = new five.Board({io: new raspi()});
const config = require("./config");
const _ = require("lodash");
try { _.merge(config, require("./config.local")); } catch (err) {}
config.serverSocketUrl = config.server + "/triggers";
let blink = null;
let connected = false;
let led = new Gpio(config.ledPin, 'out');
let led2 = new Gpio(4, 'out');
let pir = new Gpio(27, 'in', 'both');

blinkLed(led, 1000);

led2.writeSync(1); // 1 = on, 0 = off :)

process.on('SIGINT', function () {
    led.unexport();
    led2.unexport();
    pir.unexport();
});

// board.on('ready', function() {
//
//     // Create a new `motion` hardware instance.
//     var motion = new five.Motion({
//         pin: "P1-13"
//     });
//
//     // "calibrated" occurs once, at the beginning of a session,
//     motion.on("calibrated", function() {
//         console.log("calibrated", Date.now());
//     });
//
//     // "motionstart" events are fired when the "calibrated"
//     // proximal area is disrupted, generally by some form of movement
//     motion.on("motionstart", function() {
//         console.log("motionstart", Date.now());
//     });
//
//     // "motionend" events are fired following a "motionstart" event
//     // when no movement has occurred in X ms
//     motion.on("motionend", function() {
//         console.log("motionend", Date.now());
//     });
//
// });

console.log("connecting to (socket) %s", config.serverSocketUrl);
let socket = socketClient(config.serverSocketUrl, {
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

function ring() {
    let url = config.server + "/ring";
    console.log("GET " + url);
    request(url, function (error, response, body) {
        if (error) {
            console.error("error", error);
        }
        if (response.statusCode == 200) {
            console.log("GET " + url + " => success");
        } else {
            console.log("GET " + url + " => meh :(");
        }
    });
}
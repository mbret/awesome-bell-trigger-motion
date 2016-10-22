const socketClient = require("socket.io-client");
const config = require("./config");
const _ = require("lodash");
try { _.merge(config, require("./config.local")); } catch (err) {}

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
    .on('connect', function(){
        console.log('connected');
        console.log("authenticating");
        socket
            .emit("authenticate", {token: config.authToken})
            .on("authenticated", function() {
                console.log('authenticated');
            })
            .on('unauthorized', function(msg) {
                console.log("unauthorized: " + JSON.stringify(msg.data));
            });
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
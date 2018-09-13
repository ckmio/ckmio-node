'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.actions = exports.services = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _net = require('net');

var _buffer = require('buffer');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var services = exports.services = {
    auth: "10",
    chat: "22",
    topic: "21",
    funnel: "27"
};

var actions = exports.actions = {
    add: "add",
    send_chat_message: "send-chat-message",
    notify: "notify",
    subscribe: "subscribe",
    unsubscribe: "unsubscribe"
};

function client_ref() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : r & 0x3 | 0x8;
        return v.toString(16);
    });
}

function getHandler(client, type) {
    switch (type) {
        case auth:
            return client.options.authenticationHandler;
        case topic:
            return client.options.topicHandler;
        case funnel:
            return client.options.funnelHandler;
        case chat:
            return client.options.chatHandler;
        default:
            return null;

    }
}

function amleneResponseHandler(response, client) {
    var handler = client.subscriptions[response.ref] || getHandler(response.type);
    if (handler) handler(response);else console.log('No suitable handler found for this response : {JSON.stringify(response)}');
}

var CkmioClient = function () {
    function CkmioClient(options) {
        _classCallCheck(this, CkmioClient);

        this.host = "ckmio.com";
        this.port = 7023;
        this.options = options;
        this.user = options.user;
        this.password = options.password;
        this.connection = new _net.Socket();
        this.connecting = false;
        this.subscriptions = [];
        this.planKey = options.planKey;
        this.planSecret = options.planSecret;
        this.delay = 500;
        this.handlers = {
            'data': this.receiveAndDecodeMessage.bind(this),
            'connect': this.onConnection()
        };
        this.remainding = null;
        this.remaindingLength = 0;
    }

    /* start chat handlers */


    _createClass(CkmioClient, [{
        key: 'subscribeToChat',
        value: function subscribeToChat(handler) {
            var _this = this;

            this.throttle(function () {
                return _this.doSubscribe(services.chat, {}, handler);
            });
        }
    }, {
        key: 'sendChatMessage',
        value: function sendChatMessage(to, content) {
            var _this2 = this;

            var ref = client_ref();
            this.throttle(function () {
                return _this2.formatAndSendMessage(_this2.connection, services.chat, { clt_ref: ref, action: actions.send_chat_message, payload: { from: _this2.user, to: to, content: content } });
            });
        }
        /* end chat handlers */

        /* topic handlers */

    }, {
        key: 'createTopic',
        value: function createTopic(name) {
            var _this3 = this;

            var ref = client_ref();
            this.throttle(function () {
                return _this3.formatAndSendMessage(_this3.connection, services.topic, { clt_ref: ref, action: actions.add, payload: { name: name, description: "Just for us!" } });
            });
        }
    }, {
        key: 'subscribeToTopic',
        value: function subscribeToTopic(name, handler) {
            var _this4 = this;

            this.throttle(function () {
                return _this4.doSubscribe(services.topic, { name: name }, handler);
            });
        }
    }, {
        key: 'sendTopicUpdate',
        value: function sendTopicUpdate(name, updateMessage) {
            var _this5 = this;

            var ref = client_ref();
            this.throttle(function () {
                return _this5.formatAndSendMessage(_this5.connection, services.topic, { clt_ref: ref, action: actions.notify, payload: { name: name, content: updateMessage } });
            });
        }
    }, {
        key: 'login',
        value: function login(user, password, planKey, planSecret) {
            console.log('I am logging in ' + user + ' - ' + password + ' ');
            this.formatAndSendMessage(this.connection, services.auth, { action: "authenticate", clt_ref: client_ref(), payload: { user: user, password: password, plan_key: planKey, plan_secret: planSecret } });
        }

        /* funnels */

    }, {
        key: 'sendToStream',
        value: function sendToStream(name, data) {
            var _this6 = this;

            this.throttle(function () {
                return _this6.formatAndSendMessage(_this6.connection, service, { clt_ref: client_ref(), action: actions.add, payload: { stream: name, content: data } });
            });
        }
    }, {
        key: 'createStream',
        value: function createStream(name) {
            var _this7 = this;

            this.throttle(function () {
                return _this7.formatAndSendMessage(_this7.connection, services.funnel, { clt_ref: client_ref(), action: actions.subscribe, payload: { stream: name, description: "Just for us!" } });
            });
        }
    }, {
        key: 'funnel',
        value: function funnel(name, when, callback) {
            var _this8 = this;

            this.throttle(function () {
                return _this8.doSubscribe(services.funnel, { stream: name, when: when }, callback);
            });
        }
    }, {
        key: 'doSubscribe',
        value: function doSubscribe(service, data, callback) {
            var ref = client_ref();
            if (callback) this.subscriptions[ref] = callback;
            this.formatAndSendMessage(this.connection, service, { action: actions.subscribe, payload: data, clt_ref: ref });
            return ref;
        }
    }, {
        key: 'unsubscribe',
        value: function unsubscribe(service, ref) {
            var subscription = this.subscriptions[ref];
            if (subscription != null) delete subscriptions[ref];
            this.formatAndSendMessage(this.connection, service, { action: actions.unsubscribe, clt_ref: ref });
        }
    }, {
        key: 'on',
        value: function on(subscription, callback) {
            var _this9 = this;

            this.throttle(function () {
                return _this9.subscribe(subscription.conditions, callback);
            });
        }
    }, {
        key: 'waitThenInit',
        value: function waitThenInit(milliseconds, eventname, $this) {
            return function (e) {
                console.log(e);console.log(eventname);$this.connected = false;$this.connecting = true;
                setTimeout(function () {
                    return $this.init($this);
                }, milliseconds);
            };
        }
    }, {
        key: 'onConnection',
        value: function onConnection() {
            var $this = this;
            return function () {
                console.log('I am connected \n');$this.connected = true;$this.connecting = false;$this.login($this.user, $this.password, $this.planKey, $this.planSecret);
            };
        }
    }, {
        key: 'init',
        value: function init(self) {
            var $this = self == undefined ? this : self;

            if ($this.connected) return;

            if ($this.connecting != true && $this.connection.connecting != true) {
                if ($this.debug) {
                    console.log('this.connecting ' + $this.connecting);
                    console.log('this.connection.connecting ' + $this.connection.connecting);
                }

                var $waitThenInitEnd = $this.waitThenInit(5000, "end", $this);
                var $waitThenInitError = $this.waitThenInit(5000, "error", $this);
                $this.connectiong = true;
                $this.connection.on('data', $this.handlers['data']);
                $this.connection.on('end', $waitThenInitEnd);
                $this.connection.on('error', $waitThenInitError);
                $this.connection.on('connect', $this.handlers['connect']);
            }

            if (!$this.connection.connecting) {
                $this.connection.connect($this.port, $this.host);
                $this.connecting = true;
            }
        }
    }, {
        key: '__handleResponse',
        value: function __handleResponse(str) {
            if (debug) console.log("_handleresponse \n" + str);
            var r = JSON.parse(str);
            amleneResponseHandler(r.type, r.clt_ref, r.payload, this);
        }
    }, {
        key: 'throttle',
        value: function throttle(action) {
            setTimeout(action, this.delay);
        }
    }, {
        key: 'formatAndSendMessage',
        value: function formatAndSendMessage(connection, service, payload) {
            var message = service + ":" + JSON.stringify(payload);
            var dataPacket = _buffer.Buffer.from(message);
            var packetLength = dataPacket.length;
            var arr = new Uint8Array([(packetLength & 0xff000000) >> 24, (packetLength & 0x00ff0000) >> 16, (packetLength & 0x0000ff00) >> 8, packetLength & 0x000000ff]);
            connection.write(_buffer.Buffer.from(arr.buffer)); // writing the size of the packet
            connection.write(dataPacket); // writing the actual packet 
        }
    }, {
        key: 'receiveAndDecodeMessage',
        value: function receiveAndDecodeMessage(data) {
            var totalMessageLength = _buffer.Buffer.byteLength(data);
            if (this.debug) console.log("Total Message Length " + totalMessageLength);
            var accumulatedLen = 0;
            if (this.remainding != null) {
                var missingData = new _buffer.Buffer(data.buffer.slice(data.byteOffset, data.byteOffset + this.remaindingLength));
                var slicedMessage = _buffer.Buffer.concat([this.remainding, missingData]);
                this.__handleResponse(slicedMessage.toString("utf8"));
                accumulatedLen = this.remaindingLength;
            }
            while (totalMessageLength - accumulatedLen > 0) {
                var nextMessageLength = _buffer.Buffer.from(data.buffer, accumulatedLen, 4).readUInt32BE();
                if (totalMessageLength - accumulatedLen - nextMessageLength - 4 < 0) {
                    this.remainding = new _buffer.Buffer(data.buffer.slice(data.byteOffset + 4 + accumulatedLen, data.byteOffset + totalMessageLength));
                    this.remaindingLength = -(totalMessageLength - accumulatedLen - nextMessageLength - 4);
                    return;
                }
                if (this.debug) console.log("Next Message Length " + nextMessageLength);
                var slicedMessage = new _buffer.Buffer(data.buffer.slice(data.byteOffset + 4 + accumulatedLen, data.byteOffset + 4 + accumulatedLen + nextMessageLength));
                this.__handleResponse(slicedMessage.toString("utf8"));
                accumulatedLen += nextMessageLength + 4;
            }
            this.remainding = null;
        }
    }]);

    return CkmioClient;
}();

exports.default = CkmioClient;
//# sourceMappingURL=ckmio-client.js.map
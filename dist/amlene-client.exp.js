'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.actions = exports.services = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _net = require('net');

var _buffer = require('buffer');

var _fileUpload = require('./file-upload');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var services = exports.services = {
    auth: "10:",
    chat: "22:",
    topic: "21:",
    ref: "27:"
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

function find(what, value, where) {
    for (var i = 0, len = where.length; i < len; i++) {
        if (where[i][what] == value) return i;
    }
    return -1;
}

function findAndFireRegisteredCallback(type, clt_ref, payload, client) {
    var requestIndex = find('clt_ref', clt_ref, client.requests);
    console.log(requestIndex);
    if (requestIndex != -1) {
        var cb = client.requests[requestIndex].callback;
        cb(type, clt_ref, payload, client);
        client.requests.splice(requestIndex, 1);
        return true;
    }
    var subscription = client.subscriptions[clt_ref];
    if (subscription) {
        var _cb = subscription.callback;
        _cb(type, clt_ref, payload, client);
        return true;
    }
    return false;
}

function amleneResponseHandler(type, clt_ref, payload, client) {
    if (findAndFireRegisteredCallback(type, clt_ref, payload, client)) {
        return;
    } else {
        switch (type) {
            case services.r_auth:
                client.authenticated = true;
                if (client.handlers['onAuthenticated']) {
                    client.handlers[authenticated](payload);
                }
                break;

            case services.r_subscribe:
                var subscription = client.subscriptions[payload.clt_ref];
                if (subscription != null) {
                    subscription.ack = 1;
                    subscription.srv_ref = payload.srv_ref;
                }
                break;

            case services.notification:
                var subscription = find('srv_ref', payload.srv_ref, client.subscriptions);
                if (subscription != null) subcription.handler(payload, client);
                break;

            case services.r_transaction:
            case services.r_ref:
            case services.r_market:
                var request = client.requests[payload.clt_ref];
                if (request != null && request.handler != null) request.handler(payload);else console.log(payload);
                break;

            case services.message:
                var handler = client.handlers['onMessage'];
                if (handler) {
                    handler(payload);
                }
                break;

            default:
                console.log("Unknown Message");
                console.log("type = " + type);
                console.log("payload = " + JSON.stringify(payload));

        }
    }
}

var AmleneClient = function () {
    function AmleneClient(host, port, user, password, planKey, planSecret) {
        _classCallCheck(this, AmleneClient);

        this.host = host;
        this.port = port;
        this.user = user;
        this.password = password;
        this.connection = new _net.Socket();
        this.connecting = false;
        this.subscriptions = [];
        this.planKey = planKey;
        this.planSecret = planSecret;
        this.delay = 500;
        this.requests = [];
        this.handlers = {
            'data': this.receiveAndDecodeMessage.bind(this),
            'connect': this.onConnection()
        };
        this.remainding = null;
        this.remaindingLength = 0;
    }

    _createClass(AmleneClient, [{
        key: 'sendEntity',
        value: function sendEntity(entity, cb) {
            if (this.connected) {
                var ref = client_ref();
                if (cb) {
                    this.requests.push({ clt_ref: ref, callback: cb });
                }
                this.formatAndSendMessage(this.connection, services.ref, { clt_ref: ref, action: actions.add, payload: entity });
            } else {
                console.log('You are not connected yet!');
            }
        }

        /* start chat handlers */

    }, {
        key: 'subscribeToChat',
        value: function subscribeToChat() {
            var _this = this;

            var ref = client_ref();
            this.throttle(function () {
                return _this.formatAndSendMessage(_this.connection, services.chat, { clt_ref: ref, action: actions.subscribe, payload: {} });
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
        value: function subscribeToTopic(name, callback) {
            var _this4 = this;

            var ref = client_ref();
            this.throttle(function () {
                return _this4.formatAndSendMessage(_this4.connection, services.topic, { clt_ref: ref, action: actions.subscribe, payload: { name: name } });
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
        /* end handler */

        /* file upload handler */

    }, {
        key: 'uploadfile',
        value: function uploadfile(fileName, fileType, fileSize, binaryContent, callback) {
            var _this6 = this;

            var ref = client_ref();
            this.subscriptions[ref] = { request: new _fileUpload.FileUploadRequest(fileName, fileType, fileSize), clt_ref: ref, ack: 0, callback: callback };
            this.throttle(function () {
                return _this6.doUploadFile(fileName, fileType, fileSize, binaryContent, callback);
            });
        }

        /* end file upload handler */

    }, {
        key: 'doUploadFile',
        value: function doUploadFile(Request, binaryContent, callback) {
            this.formatAndSendMessage(this.connection, services.fileUpload, { action: "init-session", clt_ref: ref, payload: Request });
            return ref;
        }
    }, {
        key: 'login',
        value: function login(user, password, planKey, planSecret) {
            console.log('I am logging in ' + user + ' - ' + password + ' ');
            this.formatAndSendMessage(this.connection, services.auth, { action: "authenticate", clt_ref: client_ref(), payload: { user: user, password: password, plan_key: planKey, plan_secret: planSecret } });
        }

        /* funnels */

    }, {
        key: 'createStream',
        value: function createStream(name) {
            var _this7 = this;

            var ref = client_ref();
            this.throttle(function () {
                return _this7.formatAndSendMessage(_this7.connection, services.ref, { clt_ref: ref, action: actions.subscribe, payload: { stream: name, description: "Just for us!" } });
            });
        }
    }, {
        key: 'funnel',
        value: function funnel(name, when, callback) {
            var _this8 = this;

            this.throttle(function () {
                return _this8.doSubscribe({ stream: name, when: when }, callback);
            });
        }
    }, {
        key: 'sendToStream',
        value: function sendToStream(name, data) {
            var _this9 = this;

            var ref = client_ref();
            this.throttle(function () {
                return _this9.formatAndSendMessage(_this9.connection, services.ref, { clt_ref: ref, action: actions.add, payload: { stream: name, content: data } });
            });
        }
    }, {
        key: 'doSubscribe',
        value: function doSubscribe(conditions, callback) {
            var ref = client_ref();
            this.subscriptions[ref] = { conditions: conditions, clt_ref: ref, ack: 0, callback: callback };
            this.formatAndSendMessage(this.connection, services.ref, { action: actions.subscribe, payload: conditions, clt_ref: ref });
            return ref;
        }
    }, {
        key: 'unsubscribe',
        value: function unsubscribe(ref) {
            var subscription = this.subscriptions[ref];
            if (subscription != null) this.subscriptions.remove(subscription);
            this.formatAndSendMessage(this.connection, services.unsubscribe, { reference: ref });
        }
    }, {
        key: 'on',
        value: function on(subscription, callback) {
            var _this10 = this;

            this.throttle(function () {
                return _this10.subscribe(subscription.conditions, callback);
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
        value: function formatAndSendMessage(connection, verb, payload) {
            var message = verb + JSON.stringify(payload);
            var packetLength = dataPacket.length;
            var arr = new Uint8Array([(packetLength & 0xff000000) >> 24, (packetLength & 0x00ff0000) >> 16, (packetLength & 0x0000ff00) >> 8, packetLength & 0x000000ff]);
            connection.write(_buffer.Buffer.from(arr.buffer)); // writing the size of the packet
            connection.write(dataPacket); // writing the actual packet 
        }
    }, {
        key: 'receiveAndDecodeMessage',
        value: function receiveAndDecodeMessage(data) {
            var totalMessageLength = _buffer.Buffer.byteLength(data);
            console.log("Total Message Length " + totalMessageLength);
            var accumulatedLen = 0;
            if (this.remainding != null) {
                //var missingData = Buffer.from(data.buffer, 0, this.remaindingLength);
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
                console.log("Next Message Length " + nextMessageLength);
                var slicedMessage = new _buffer.Buffer(data.buffer.slice(data.byteOffset + 4 + accumulatedLen, data.byteOffset + 4 + accumulatedLen + nextMessageLength));
                this.__handleResponse(slicedMessage.toString("utf8"));
                accumulatedLen += nextMessageLength + 4;
            }
            this.remainding = null;
        }
    }]);

    return AmleneClient;
}();

exports.default = AmleneClient;
//# sourceMappingURL=amlene-client.exp.js.map
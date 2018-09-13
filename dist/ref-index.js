"use strict";

var _amleneClient = require("./amlene-client");

var _amleneClient2 = _interopRequireDefault(_amleneClient);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//var HOST = '127.0.0.1';
var HOST = 'dev.ckmio.com';
var PORT = 7023;
var planKey = "root-plan-key";
var planSecret = "root-plan-secret";

var user = "Abdoulaye";
var password = "Password";
var amleneClient = new _amleneClient2.default(HOST, PORT, user, password, planKey, planSecret);
amleneClient.init();
var amleneClient2 = new _amleneClient2.default(HOST, PORT, "Mamadou", password, planKey, planSecret);
amleneClient2.init();

amleneClient.createStream("A brand new Stream");
amleneClient.funnel("A brand new Stream", [{ field: "name", op: "contains", value: "Abdoulaye" }], function (type, clt_ref, payload, client) {
	return console.log("client 1 received  " + JSON.stringify(payload));
});
amleneClient2.funnel("A brand new Stream", [{ field: "age", op: "greater_than", value: 40 }], function (type, clt_ref, payload, client) {
	return console.log("client 2 received  " + JSON.stringify(payload));
});

setTimeout(function () {
	amleneClient.sendToStream("A brand new Stream", { name: "Abdoulaye Sissokho", age: 35 });
	amleneClient.sendToStream("A brand new Stream", { name: "Mamadou", age: 56 });
}, 5000);
// HHbCsU2d
//# sourceMappingURL=ref-index.js.map
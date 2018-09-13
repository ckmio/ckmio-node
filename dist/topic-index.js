"use strict";

var _ckmioClient = require("./ckmio-client");

var _ckmioClient2 = _interopRequireDefault(_ckmioClient);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var HOST = 'dev.ckmio.com';
var PORT = 7023;
var planKey = "root-plan-key";
var planSecret = "root-plan-secret";
var user = "Abdoulaye";
var password = "Password";
var amleneClient = new _ckmioClient2.default(HOST, PORT, user, password, planKey, planSecret);
amleneClient.init();
var amleneClient2 = new _ckmioClient2.default(HOST, PORT, "Mamadou", password, planKey, planSecret);
amleneClient2.init();

amleneClient.createTopic("A brand new topic");
//amleneClient.subscribeToTopic("A brand new topic");
//amleneClient2.subscribeToTopic("A brand new topic");

setTimeout(function () {
	for (var i = 0; i < 12; i++) {
		amleneClient.sendTopicUpdate("A brand new topic", "Hey guys, we love you! " + i);
	}
}, 5000);
//# sourceMappingURL=topic-index.js.map
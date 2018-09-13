"use strict";

var _ckmioClient = require("./ckmio-client");

var _ckmioClient2 = _interopRequireDefault(_ckmioClient);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var tahibou = new _ckmioClient2.default({ planKey: "", planSecret: "", userName: "Tahibou" });
client.subscribeToChat(function (message) {
	console.log("Mamadou received a message from {message.from} \n {message.content}");
});

var mamadou = new _ckmioClient2.default({ planKey: "", planSecret: "", userName: "Mamadou" });
client.subscribeToChat(function (message) {
	console.log("Mamadou received a message from {message.from} \n {message.content}");
});

setTimeout(function () {
	for (var i = 0; i < 12; i++) {
		mamadou.sendChatMassage("Tahibou", "Hey guys, we love you! " + i);
		tahibou.sendChatMassage("Mamadou", "Hey guys, we love you! " + i);
	}
}, 5000);
//# sourceMappingURL=chat-index.js.map
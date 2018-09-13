"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FileUploadRequest = exports.FileUploadRequest = function FileUploadRequest(file_name, file_type, file_size) {
	_classCallCheck(this, FileUploadRequest);

	this.file_name = file_name;
	this.file_size = file_size;
	this.file_type = file_type;
};

var FileSlot = exports.FileSlot = function FileSlot(slot_id, file_name, file_type, file_size, upload_host, upload_port) {
	_classCallCheck(this, FileSlot);

	this.slot_id = slot_id;
	this.file_size = file_size;
	this.file_type = file_type;
	this.file_name = file_name;
};
//# sourceMappingURL=file-upload.js.map
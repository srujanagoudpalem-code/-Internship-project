"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImages = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const errorHandler_1 = require("./errorHandler");
// Use memory storage for buffering file content
const storage = multer_1.default.memoryStorage();
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new errorHandler_1.AppError('Invalid file type! Only images are allowed.', 400), false);
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});
exports.uploadImages = exports.upload.array('images', 5); // limit of 5 images per request

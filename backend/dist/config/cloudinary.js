"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCloudinaryConfigured = void 0;
const cloudinary_1 = require("cloudinary");
exports.isCloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET);
if (exports.isCloudinaryConfigured) {
    cloudinary_1.v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}
exports.default = cloudinary_1.v2;

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImage = exports.uploadImage = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const cloudinary_1 = __importStar(require("../config/cloudinary"));
const localUploadsDir = path_1.default.join(__dirname, '../../uploads');
// Ensure local uploads directory exists
if (!fs_1.default.existsSync(localUploadsDir)) {
    fs_1.default.mkdirSync(localUploadsDir, { recursive: true });
}
const uploadImage = async (file) => {
    if (cloudinary_1.isCloudinaryConfigured) {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.default.uploader.upload_stream({ folder: 'gift_returns' }, (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    return reject(error);
                }
                if (!result)
                    return reject(new Error('Cloudinary upload result empty'));
                resolve({
                    imageUrl: result.secure_url,
                    publicId: result.public_id,
                });
            });
            uploadStream.end(file.buffer);
        });
    }
    else {
        // Local file storage
        const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path_1.default.extname(file.originalname)}`;
        const filePath = path_1.default.join(localUploadsDir, filename);
        await fs_1.default.promises.writeFile(filePath, file.buffer);
        // Serve locally (will configure static path in Express)
        const imageUrl = `/uploads/${filename}`;
        return {
            imageUrl,
            publicId: filename,
        };
    }
};
exports.uploadImage = uploadImage;
const deleteImage = async (publicId) => {
    try {
        if (cloudinary_1.isCloudinaryConfigured && !publicId.includes('.')) {
            await cloudinary_1.default.uploader.destroy(publicId);
        }
        else {
            const filePath = path_1.default.join(localUploadsDir, publicId);
            if (fs_1.default.existsSync(filePath)) {
                await fs_1.default.promises.unlink(filePath);
            }
        }
        console.log(`Image deleted successfully: ${publicId}`);
    }
    catch (error) {
        console.error(`Failed to delete image: ${publicId}`, error);
    }
};
exports.deleteImage = deleteImage;

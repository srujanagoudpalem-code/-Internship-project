import fs from 'fs';
import path from 'path';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary';

const localUploadsDir = path.join(__dirname, '../../uploads');

// Ensure local uploads directory exists
if (!fs.existsSync(localUploadsDir)) {
  fs.mkdirSync(localUploadsDir, { recursive: true });
}

export const uploadImage = async (file: Express.Multer.File): Promise<{ imageUrl: string; publicId: string | null }> => {
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'gift_returns' },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            return reject(error);
          }
          if (!result) return reject(new Error('Cloudinary upload result empty'));
          resolve({
            imageUrl: result.secure_url,
            publicId: result.public_id,
          });
        }
      );
      uploadStream.end(file.buffer);
    });
  } else {
    // Local file storage
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    const filePath = path.join(localUploadsDir, filename);
    await fs.promises.writeFile(filePath, file.buffer);
    
    // Serve locally (will configure static path in Express)
    const imageUrl = `/uploads/${filename}`;
    return {
      imageUrl,
      publicId: filename,
    };
  }
};

export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    if (isCloudinaryConfigured && !publicId.includes('.')) {
      await cloudinary.uploader.destroy(publicId);
    } else {
      const filePath = path.join(localUploadsDir, publicId);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    }
    console.log(`Image deleted successfully: ${publicId}`);
  } catch (error) {
    console.error(`Failed to delete image: ${publicId}`, error);
  }
};

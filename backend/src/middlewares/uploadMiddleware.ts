import multer from 'multer';
import { AppError } from './errorHandler';

// Use memory storage for buffering file content
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type! Only images are allowed.', 400), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export const uploadImages = upload.array('images', 5); // limit of 5 images per request

import multer from 'multer';
import { AppError } from './error.middleware.js';

// Store in memory buffer so we can stream to Cloudinary or write directly
const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export const uploadImage = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
          400
        )
      );
    }
  },
});

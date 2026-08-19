import multer from 'multer';
import { ApiError } from '../utils/ApiError';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const storage = multer.memoryStorage();

export const uploadImage = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new ApiError(400, 'Only JPEG, PNG, WEBP, or GIF images are allowed'));
      return;
    }
    cb(null, true);
  }
});
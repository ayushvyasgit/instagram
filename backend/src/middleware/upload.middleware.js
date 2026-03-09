import multer from 'multer';
import { ValidationError } from '../utils/errors.js';

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/mpeg', 'video/quicktime'];
const ALL_ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

// File size limits (10MB for images, 50MB for videos)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

// Configure multer
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALL_ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(
      new ValidationError(
        `Invalid file type: ${file.mimetype}. Allowed: ${ALL_ALLOWED_TYPES.join(', ')}`
      ),
      false
    );
  }

  // Check file size based on type
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.mimetype);
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

  if (file.size > maxSize) {
    return cb(
      new ValidationError(
        `File too large. Max size: ${maxSize / 1024 / 1024}MB`
      ),
      false
    );
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_VIDEO_SIZE, // Max overall size
    files: 10, // Max 10 files per request (for carousel)
  },
});

// Middleware to handle upload errors
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large',
        code: 'FILE_TOO_LARGE',
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files',
        code: 'TOO_MANY_FILES',
      });
    }
  }
  next(err);
};
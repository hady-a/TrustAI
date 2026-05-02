import multer, { StorageEngine } from 'multer';
import { logger } from '../lib/logger';
import { AppError } from '../lib/AppError';

/**
 * Business Analysis Upload Configuration
 * Handles file uploads for business analysis endpoint
 * Stores files in memory for efficient forwarding to Flask
 */

const storage: StorageEngine = multer.memoryStorage();

/**
 * File filter for business analysis
 * Validates file types and MIME types
 */
const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const fieldname = file.fieldname;

  // Define allowed MIME types per field
  const allowedMimes: Record<string, string[]> = {
    audio: [
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/m4a',
      'audio/aac',
      'audio/webm',
      'audio/flac',
    ],
    image: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
    ],
  };

  // Get allowed MIME types for this field
  const allowed = allowedMimes[fieldname];

  if (!allowed) {
    // Unknown field - reject it
    return cb(
      new AppError(
        `Unexpected field "${fieldname}". Expected "audio" or "image"`,
        400,
        'INVALID_FIELD'
      )
    );
  }

  // Validate MIME type
  if (!allowed.includes(file.mimetype)) {
    logger.warn(
      {
        field: fieldname,
        mimeType: file.mimetype,
        allowed,
      },
      'Invalid MIME type for upload'
    );
    return cb(
      new AppError(
        `Invalid file type for field "${fieldname}": ${file.mimetype}`,
        400,
        'INVALID_MIME_TYPE'
      )
    );
  }

  logger.debug(
    {
      field: fieldname,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    },
    'File validated'
  );

  cb(null, true);
};

/**
 * Business analysis upload middleware
 * Handles multiple file uploads for different fields:
 * - audio (required, single file)
 * - image (optional, single file)
 */
export const businessAnalysisUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB per file
    files: 2, // Max 2 files (audio + image)
  },
});

/**
 * Middleware to validate business analysis upload
 * Ensures audio file is present and files are submitted
 */
export const validateBusinessAnalysisUpload = (
  req: any,
  res: any,
  next: any
) => {
  try {
    // Check if any files were uploaded
    if (!req.files || Object.keys(req.files).length === 0) {
      logger.warn('No files uploaded');
      return next(
        new AppError('No files uploaded', 400, 'NO_FILES')
      );
    }

    // Check if audio file is present
    if (!req.files.audio || req.files.audio.length === 0) {
      logger.warn('Missing required audio file');
      return next(
        new AppError('Audio file is required', 400, 'MISSING_AUDIO')
      );
    }

    logger.debug(
      {
        audioCount: req.files.audio?.length || 0,
        imageCount: req.files.image?.length || 0,
      },
      'Upload validation passed'
    );

    next();
  } catch (error) {
    logger.error(
      { error: (error as Error).message },
      'Upload validation error'
    );
    next(error);
  }
};

/**
 * Middleware to handle multer errors
 */
export const handleBusinessAnalysisMulterError = (
  err: any,
  req: any,
  res: any,
  next: any
) => {
  if (err instanceof multer.MulterError) {
    logger.warn(
      { code: err.code, field: err.field },
      'Multer error occurred'
    );

    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(
        new AppError(
          'File size exceeds 100MB limit',
          413,
          'FILE_TOO_LARGE'
        )
      );
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(
        new AppError('Too many files uploaded (max 2)', 400, 'TOO_MANY_FILES')
      );
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(
        new AppError(
          `Unexpected file in field "${err.field}"`,
          400,
          'UNEXPECTED_FILE'
        )
      );
    }
  }

  next(err);
};

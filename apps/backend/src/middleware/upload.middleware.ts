import multer, { StorageEngine } from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../lib/logger';
import { AppError } from '../lib/AppError';
import { FILE_CONFIG } from '../services/file.service';

/**
 * Memory storage for processing files in memory before saving
 * Keeps files small enough to process without overwhelming RAM
 */
const storage: StorageEngine = multer.memoryStorage();

/**
 * File filter to validate uploads
 */
const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Filename sanitization
  const originalName = file.originalname;
  const ext = path.extname(originalName).toLowerCase();

  // Basic extension check
  const allowedExts = ['.mp4', '.avi', '.mov', '.webm', '.mp3', '.wav', '.ogg', '.aac', '.txt', '.pdf', '.json', '.csv'];
  if (!allowedExts.includes(ext)) {
    return cb(
      new AppError(`File extension ${ext} not allowed`, 400, 'INVALID_FILE_TYPE')
    );
  }

  // Check MIME type
  const videoMimes = FILE_CONFIG.allowedMimeTypes.VIDEO;
  const audioMimes = FILE_CONFIG.allowedMimeTypes.AUDIO;
  const textMimes = FILE_CONFIG.allowedMimeTypes.TEXT;
  const allMimes = [...videoMimes, ...audioMimes, ...textMimes];

  if (!allMimes.includes(file.mimetype)) {
    return cb(
      new AppError(
        `MIME type ${file.mimetype} not allowed`,
        400,
        'INVALID_MIME_TYPE'
      )
    );
  }

  cb(null, true);
};

/**
 * Multer upload configuration with security settings
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_CONFIG.maxFileSize,
    files: 5, // Max 5 files per request
  },
});

/**
 * Middleware to validate file upload constraints
 */
export const validateFileUpload = (
  req: any,
  res: any,
  next: any
) => {
  if (!req.files || req.files.length === 0) {
    return next(new AppError('No files uploaded', 400, 'NO_FILES'));
  }

  // Ensure analysisId is provided
  if (!req.body.analysisId) {
    return next(new AppError('analysisId is required', 400, 'MISSING_ANALYSIS_ID'));
  }

  // Validate file types match requested analysis
  const requestedFileTypes = req.body.fileTypes
    ? (Array.isArray(req.body.fileTypes) ? req.body.fileTypes : [req.body.fileTypes])
    : [];

  if (requestedFileTypes.length > 0) {
    for (const file of req.files) {
      if (!requestedFileTypes.includes(file.fieldname)) {
        return next(
          new AppError(
            `File ${file.originalname} does not match requested file types`,
            400,
            'FILE_TYPE_MISMATCH'
          )
        );
      }
    }
  }

  logger.info(
    { fileCount: req.files.length, analysisId: req.body.analysisId },
    'Files validated successfully'
  );

  next();
};

/**
 * Middleware to handle multer errors
 */
export const handleMulterError = (
  err: any,
  req: any,
  res: any,
  next: any
) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(
        new AppError(
          `File size exceeds ${FILE_CONFIG.maxFileSize / (1024 * 1024)}MB limit`,
          413,
          'FILE_TOO_LARGE'
        )
      );
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(new AppError('Too many files uploaded', 400, 'TOO_MANY_FILES'));
    }
  }
  next(err);
};

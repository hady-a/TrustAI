import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { flaskAIService } from '../services/flask.ai.service';
import { logger } from '../config/logger';

/**
 * Business Analysis Route
 * POST /analyze/business
 * Handles file uploads and forwards to Flask AI service
 */

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
fs.ensureDirSync(uploadsDir);

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filter
const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes: Record<string, string[]> = {
    audio: [
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/m4a',
      'audio/aac',
      'audio/webm',
      'audio/flac',
      'application/octet-stream', // Allow generic binary for testing
    ],
    image: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/octet-stream', // Allow generic binary for testing
    ],
  };

  const allowed = allowedMimes[file.fieldname];
  if (allowed && allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for field ${file.fieldname}: ${file.mimetype}`));
  }
};

// Multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

const router = Router();

/**
 * Multer error handling middleware
 */
const multerErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: any
) => {
  if (err instanceof multer.MulterError) {
    logger.error({ code: err.code }, 'Multer error');
    return res.status(400).json({
      success: false,
      error: `File upload error: ${err.message}`,
    });
  }
  if (err) {
    logger.error({ error: err.message }, 'Upload validation error');
    return res.status(400).json({
      success: false,
      error: err.message || 'File upload error',
    });
  }
  next();
};

/**
 * POST /analyze/business
 * Analyzes business data using Flask AI service
 *
 * Form fields:
 * - audio (required): audio file
 * - image (optional): image file
 * - text (optional): text input
 */
router.post(
  '/analyze/business',
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'image', maxCount: 1 },
  ]),
  multerErrorHandler,
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    let audioPath: string | undefined;
    let imagePath: string | undefined;

    try {
      // Extract request data
      const files = req.files as any;
      const { text } = req.body;

      // Log request
      logger.info(
        {
          hasAudio: !!files?.audio,
          hasImage: !!files?.image,
          hasText: !!text,
        },
        '📥 Analyze request received'
      );

      // Validate audio file (required)
      if (!files?.audio || files.audio.length === 0) {
        logger.warn('❌ Missing required audio file');
        return res.status(400).json({
          success: false,
          error: 'Audio file is required',
        });
      }

      // Get file paths
      audioPath = files.audio[0].path;
      imagePath = files.image?.[0].path;

      logger.debug(
        {
          audioSize: files.audio[0].size,
          imageSize: files.image?.[0].size,
          audioPath,
          imagePath,
        },
        '📂 Files uploaded'
      );

      // Call Flask AI service
      logger.info('🚀 Calling Flask AI service...');
      const result = await flaskAIService.analyze({
        audioPath,
        imagePath,
        textInput: text,
        mode: 'BUSINESS',
      });

      if (!result.success) {
        logger.error(
          { error: result.error },
          '❌ Flask analysis failed'
        );
        return res.status(400).json({
          success: false,
          error: result.error || 'Analysis failed',
        });
      }

      const processingTime = Date.now() - startTime;
      logger.info(
        {
          processingTime,
          confidence: result.confidence,
          trustScore: result.trustScore,
        },
        '✅ Analysis completed successfully'
      );

      // Return result
      return res.status(200).json({
        success: true,
        data: result,
        processingTime,
      });
    } catch (error) {
      const err = error as Error;
      const processingTime = Date.now() - startTime;

      logger.error(
        {
          error: err.message,
          stack: err.stack,
          processingTime,
        },
        '❌ Route error'
      );

      return res.status(500).json({
        success: false,
        error: err.message || 'Internal server error',
      });
    } finally {
      // Always cleanup files
      try {
        if (audioPath && fs.existsSync(audioPath)) {
          logger.debug({ audioPath }, '🗑️ Cleaning up audio file');
          await fs.remove(audioPath);
        }
        if (imagePath && fs.existsSync(imagePath)) {
          logger.debug({ imagePath }, '🗑️ Cleaning up image file');
          await fs.remove(imagePath);
        }
      } catch (cleanupError) {
        logger.warn(
          { error: (cleanupError as Error).message },
          '⚠️ Error during cleanup'
        );
      }
    }
  }
);

export default router;

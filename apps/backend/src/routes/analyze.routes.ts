import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { flaskAIService } from '../services/flask.ai.service';
import { logger } from '../config/logger';
import { ensureWAVFormat, getAudioInfo, isValidAudioFile } from '../utils/audioConverter';

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
 */
router.post(
  '/analyze/business',
  upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'image', maxCount: 1 }]),
  multerErrorHandler,
  createAnalyzeHandler('BUSINESS')
);

/**
 * Shared handler factory for mode-specific analysis routes.
 * All modes use the same Flask endpoint; mode is forwarded as a FormData field.
 * Audio is automatically converted to WAV format for Flask/librosa compatibility.
 */
function createAnalyzeHandler(mode: 'BUSINESS' | 'INTERVIEW' | 'INVESTIGATION') {
  return async (req: Request, res: Response) => {
    const startTime = Date.now();
    let audioPath: string | undefined;
    let convertedAudioPath: string | undefined;
    let imagePath: string | undefined;

    try {
      const files = req.files as any;
      const { text } = req.body;

      logger.info({ mode, hasAudio: !!files?.audio, hasImage: !!files?.image }, `📥 ${mode} analyze request received`);

      if (!files?.audio || files.audio.length === 0) {
        logger.warn(`❌ Missing required audio file for ${mode}`);
        return res.status(400).json({ success: false, error: 'Audio file is required' });
      }

      audioPath = files.audio[0].path;
      imagePath = files.image?.[0].path;

      // Validate and convert audio to WAV format for Flask/librosa compatibility
      const isValid = await isValidAudioFile(audioPath);
      if (!isValid) {
        logger.warn({ audioPath }, `⚠️  Invalid audio file for ${mode}`);
        return res.status(400).json({ success: false, error: 'Invalid audio file format' });
      }

      convertedAudioPath = await ensureWAVFormat(audioPath);
      const audioInfo = await getAudioInfo(convertedAudioPath);

      if (audioInfo) {
        logger.info(
          { duration: audioInfo.duration, sampleRate: audioInfo.sampleRate },
          `📊 ${mode} audio info`
        );
      }

      // Forward converted WAV to Flask
      const result = await flaskAIService.analyze({
        audioPath: convertedAudioPath,
        imagePath,
        textInput: text,
        mode,
      });

      if (!result.success) {
        logger.error({ error: result.error }, `❌ Flask analysis failed for ${mode}`);
        return res.status(400).json({ success: false, error: result.error || 'Analysis failed' });
      }

      const processingTime = Date.now() - startTime;
      logger.info({ processingTime, confidence: result.confidence }, `✅ ${mode} analysis completed`);

      return res.status(200).json({ success: true, data: result, processingTime });
    } catch (error) {
      const err = error as Error;
      logger.error({ error: err.message, stack: err.stack }, `❌ ${mode} route error`);
      return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    } finally {
      try {
        // Clean up original audio file
        if (audioPath && audioPath !== convertedAudioPath && (await fs.pathExists(audioPath))) {
          await fs.remove(audioPath);
          logger.debug({ audioPath }, '🗑️  Cleaned up original audio');
        }
        // Clean up converted audio file
        if (convertedAudioPath && (await fs.pathExists(convertedAudioPath))) {
          await fs.remove(convertedAudioPath);
          logger.debug({ convertedAudioPath }, '🗑️  Cleaned up converted audio');
        }
        // Clean up image file
        if (imagePath && (await fs.pathExists(imagePath))) {
          await fs.remove(imagePath);
          logger.debug({ imagePath }, '🗑️  Cleaned up image');
        }
      } catch (cleanupError) {
        logger.warn({ error: (cleanupError as Error).message }, '⚠️ Error during cleanup');
      }
    }
  };
}

/**
 * POST /analyze/interview
 */
router.post(
  '/analyze/interview',
  upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'image', maxCount: 1 }]),
  multerErrorHandler,
  createAnalyzeHandler('INTERVIEW')
);

/**
 * POST /analyze/investigation
 */
router.post(
  '/analyze/investigation',
  upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'image', maxCount: 1 }]),
  multerErrorHandler,
  createAnalyzeHandler('INVESTIGATION')
);

/**
 * POST /analyze/live
 * Handle live audio chunks (2-3 second segments)
 * Accepts smaller audio chunks for real-time analysis with lower latency
 * Automatically converts to WAV format if needed
 */
router.post(
  '/analyze/live',
  upload.single('audio'),
  multerErrorHandler,
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    let audioPath: string | undefined;
    let convertedAudioPath: string | undefined;

    try {
      const file = req.file;
      const { mode = 'BUSINESS' } = req.body;

      logger.info({ mode, audioSize: file?.size }, '📹 Live chunk received');

      if (!file) {
        logger.warn('❌ Missing audio chunk');
        return res.status(400).json({ success: false, error: 'Audio chunk is required' });
      }

      // Validate mode is one of the allowed values
      const validModes = ['BUSINESS', 'INTERVIEW', 'INVESTIGATION'];
      if (!validModes.includes(mode)) {
        logger.warn({ providedMode: mode }, `❌ Invalid mode: ${mode}`);
        return res.status(400).json({
          success: false,
          error: `Invalid mode. Must be one of: ${validModes.join(', ')}`,
        });
      }

      audioPath = file.path;

      // Validate audio file
      const isValid = await isValidAudioFile(audioPath);
      if (!isValid) {
        logger.warn({ audioPath }, '⚠️  Invalid audio file format');
        return res.status(400).json({
          success: false,
          error: 'Invalid audio file format',
        });
      }

      // Convert to WAV format if needed
      convertedAudioPath = await ensureWAVFormat(audioPath);
      const audioInfo = await getAudioInfo(convertedAudioPath);

      if (audioInfo) {
        logger.info(
          { duration: audioInfo.duration, sampleRate: audioInfo.sampleRate },
          '📊 Audio info'
        );
      }

      // Forward to Flask with mode parameter
      const result = await flaskAIService.analyze({
        audioPath: convertedAudioPath,
        imagePath: undefined,
        textInput: undefined,
        mode: mode as 'BUSINESS' | 'INTERVIEW' | 'INVESTIGATION',
      });

      if (!result.success) {
        logger.warn({ error: result.error }, `⚠️ Live chunk analysis returned partial result`);
        // For live analysis, we still return success even with partial results
        return res.status(200).json({
          success: true,
          data: result,
          processingTime: Date.now() - startTime,
          insights: result.insights || 'Processing...',
        });
      }

      const processingTime = Date.now() - startTime;
      logger.info({ processingTime, mode }, `✅ Live chunk analyzed`);

      return res.status(200).json({
        success: true,
        data: result,
        processingTime,
        insights: result.insights || 'Analysis complete',
      });
    } catch (error) {
      const err = error as Error;
      logger.error({ error: err.message }, '❌ Live analysis error');
      // Don't fail the request on error; send partial response
      return res.status(200).json({
        success: true,
        error: err.message,
        insights: 'Error processing chunk, will retry',
      });
    } finally {
      try {
        // Clean up original audio file
        if (audioPath && audioPath !== convertedAudioPath && (await fs.pathExists(audioPath))) {
          await fs.remove(audioPath);
          logger.debug({ audioPath }, '🗑️  Cleaned up original audio');
        }
        // Clean up converted audio file
        if (convertedAudioPath && (await fs.pathExists(convertedAudioPath))) {
          await fs.remove(convertedAudioPath);
          logger.debug({ convertedAudioPath }, '🗑️  Cleaned up converted audio');
        }
      } catch (cleanupError) {
        logger.warn(
          { error: (cleanupError as Error).message },
          '⚠️  Error cleaning up audio files'
        );
      }
    }
  }
);

export default router;

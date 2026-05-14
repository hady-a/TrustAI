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
      'audio/mp3',
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/ogg',
      'audio/m4a',
      'audio/x-m4a',
      'audio/mp4',
      'audio/aac',
      'audio/webm',
      'audio/flac',
      // Video containers carry audio tracks — ffmpeg extracts audio downstream.
      'video/mp4',
      'video/quicktime',
      'video/webm',
      'video/x-matroska',
      'application/octet-stream',
    ],
    image: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/octet-stream',
    ],
  };

  const allowed = allowedMimes[file.fieldname];
  // Permissive fallback: many browsers send audio/* or video/* with subtypes we
  // can't enumerate exhaustively. Accept the family if the fieldname is `audio`.
  const familyMatches =
    file.fieldname === 'audio' &&
    (file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/'));

  if ((allowed && allowed.includes(file.mimetype)) || familyMatches) {
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
 * POST /analyze/:mode/image
 *
 * Image-only analysis. Flask's pipeline requires audio, so we pair the
 * uploaded image with a generated 1s silent WAV. The face analyzer produces
 * real data; voice/credibility components come back near-zero, which is
 * faithful to "image only — no speech signal."
 */
import { exec as _exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(_exec);

async function generateSilentWav(): Promise<string> {
  const out = path.join(uploadsDir, `silent-${Date.now()}.wav`);
  await execAsync(
    `ffmpeg -f lavfi -i "anullsrc=r=16000:cl=mono" -t 1 -y "${out}"`,
    { timeout: 10000 }
  );
  return out;
}

router.post(
  '/analyze/:mode/image',
  upload.single('image'),
  multerErrorHandler,
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    const modeRaw = (req.params.mode || '').toLowerCase();
    const modeMap: Record<string, 'BUSINESS' | 'INTERVIEW' | 'INVESTIGATION'> = {
      business: 'BUSINESS',
      interview: 'INTERVIEW',
      investigation: 'INVESTIGATION',
      criminal: 'INVESTIGATION',
    };
    const mode = modeMap[modeRaw];

    let imagePath: string | undefined;
    let silentAudioPath: string | undefined;

    try {
      if (!mode) {
        return res.status(400).json({ success: false, error: `Unknown mode: ${modeRaw}` });
      }
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'Image file is required' });
      }
      imagePath = req.file.path;
      logger.info({ mode, imagePath }, '🖼️  Image analyze request received');

      silentAudioPath = await generateSilentWav();

      const result = await flaskAIService.analyze({
        audioPath: silentAudioPath,
        imagePath,
        textInput: undefined,
        mode,
      });

      if (!result.success) {
        const errMsg = result.error || 'Image analysis failed';
        const isUpstreamDown =
          typeof errMsg === 'string' &&
          /AI service unavailable|ECONNREFUSED|ETIMEDOUT|EHOSTUNREACH/i.test(errMsg);
        return res.status(isUpstreamDown ? 502 : 400).json({ success: false, error: errMsg });
      }

      const processingTime = Date.now() - startTime;
      return res.status(200).json({ ...(result as any), processingTime });
    } catch (error) {
      const err = error as Error;
      logger.error({ error: err.message }, '❌ Image analyze error');
      return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    } finally {
      try {
        if (imagePath && (await fs.pathExists(imagePath))) await fs.remove(imagePath);
        if (silentAudioPath && (await fs.pathExists(silentAudioPath))) await fs.remove(silentAudioPath);
      } catch (cleanupError) {
        logger.warn({ error: (cleanupError as Error).message }, '⚠️ Image cleanup error');
      }
    }
  }
);

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
        const errMsg = result.error || 'Analysis failed';
        const isUpstreamDown =
          typeof errMsg === 'string' &&
          /AI service unavailable|ECONNREFUSED|ETIMEDOUT|EHOSTUNREACH/i.test(errMsg);
        return res.status(isUpstreamDown ? 502 : 400).json({ success: false, error: errMsg });
      }

      const processingTime = Date.now() - startTime;
      logger.info({ processingTime, confidence: (result as any)?.data?.credibility?.confidence_level }, `✅ ${mode} analysis completed`);

      // Transparent proxy: forward Flask's envelope unchanged so the
      // frontend transformer can read `apiResponse.data.analysis` directly.
      // (Previously we double-wrapped — `data.data.analysis` — which silently
      // broke the UI's "analysis missing" guard.)
      return res.status(200).json({ ...(result as any), processingTime });
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

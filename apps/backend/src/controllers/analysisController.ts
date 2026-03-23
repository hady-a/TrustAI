/**
 * TrustAI Backend - Analysis Controller
 * Handles API requests for AI analysis
 * 
 * Routes:
 * POST /analysis/business - Business analysis
 * POST /analysis/hr - HR interview analysis
 * POST /analysis/investigation - Investigation analysis
 */

import { Router, Request, Response, NextFunction } from 'express';
import multer, { MulterError } from 'multer';
import path from 'path';
import fs from 'fs';
import { FlaskAIService } from '../services/FlaskAIService';

// Initialize Flask AI service - uses port 8000 where Flask is running
const flaskAIService = new FlaskAIService(
  process.env.FLASK_API_URL || 'http://localhost:8000'
);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = {
      audio: ['audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/flac', 'audio/x-wav'],
      image: ['image/jpeg', 'image/png', 'image/bmp', 'image/x-bmp']
    };

    // Check file field name and type
    if (file.fieldname === 'audio' && allowedMimes.audio.includes(file.mimetype)) {
      cb(null, true);
    } else if (file.fieldname === 'image' && allowedMimes.image.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type for ${file.fieldname}: ${file.mimetype}`));
    }
  }
});

// Create router
const router = Router();

/**
 * Utility: Cleanup uploaded files
 */
function cleanupFiles(files: any): void {
  if (!files) return;

  const removeFile = (filePath: string): void => {
    try {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error(`Failed to cleanup file ${filePath}:`, err);
    }
  };

  if (files.audio) {
    (Array.isArray(files.audio) ? files.audio : [files.audio]).forEach(
      (file: any) => removeFile(file.path)
    );
  }

  if (files.image) {
    (Array.isArray(files.image) ? files.image : [files.image]).forEach(
      (file: any) => removeFile(file.path)
    );
  }
}

/**
 * Utility: Send standardized success response
 */
function sendSuccess(res: Response, data: any, statusCode: number = 200): Response {
  return res.status(statusCode).json({
    success: true,
    data,
    timestamp: new Date().toISOString()
  });
}

/**
 * Utility: Send standardized error response
 */
function sendError(res: Response, message: string, statusCode: number = 500): Response {
  return res.status(statusCode).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  });
}

/**
 * POST /analysis/business
 * Business Meeting/Interview Analysis
 * 
 * Analyzes facial expressions, voice patterns, and credibility
 * for business meetings or interviews
 */
router.post(
  '/business',
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'image', maxCount: 1 }
  ]),
  async (req: Request, res: Response): Promise<void> => {
    let uploadedFiles: any = req.files;

    try {
      const files = uploadedFiles as any;

      // Validate files exist
      if (!files || !files.audio || !files.image) {
        res.status(400).json({
          success: false,
          error: 'Missing required files. Please provide both audio and image files.'
        });
        return;
      }

      const audioPath = files.audio[0].path;
      const imagePath = files.image[0].path;
      const text = req.body.text || '';

      console.log('🔍 Starting business analysis...', {
        audio: audioPath,
        image: imagePath,
        hasText: !!text
      });

      // Call Flask AI API
      const result = await flaskAIService.analyzeBusinessMode({
        audioPath,
        imagePath,
        text
      });

      console.log('✓ Analysis complete');

      // Return result
      if (result.success) {
        sendSuccess(res, result.data);
      } else {
        sendError(res, result.message || 'Analysis completed with errors', 200);
      }

    } catch (error: any) {
      console.error('❌ Business analysis error:', error);
      sendError(res, error.message || 'Analysis failed', 500);

    } finally {
      // Always cleanup files
      cleanupFiles(uploadedFiles);
    }
  }
);

/**
 * POST /analysis/hr
 * HR Interview Analysis
 * 
 * Analyzes stress levels, deception indicators, and emotional
 * responses during HR interviews
 */
router.post(
  '/hr',
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'image', maxCount: 1 }
  ]),
  async (req: Request, res: Response): Promise<void> => {
    let uploadedFiles: any = req.files;

    try {
      const files = uploadedFiles as any;

      if (!files || !files.audio || !files.image) {
        res.status(400).json({
          success: false,
          error: 'Missing required files. Please provide both audio and image files.'
        });
        return;
      }

      const audioPath = files.audio[0].path;
      const imagePath = files.image[0].path;
      const text = req.body.text || '';

      console.log('🔍 Starting HR analysis...', {
        audio: audioPath,
        image: imagePath,
        hasText: !!text
      });

      const result = await flaskAIService.analyzeHRMode({
        audioPath,
        imagePath,
        text
      });

      console.log('✓ Analysis complete');

      if (result.success) {
        sendSuccess(res, result.data);
      } else {
        sendError(res, result.message || 'Analysis completed with errors', 200);
      }

    } catch (error: any) {
      console.error('❌ HR analysis error:', error);
      sendError(res, error.message || 'Analysis failed', 500);

    } finally {
      cleanupFiles(uploadedFiles);
    }
  }
);

/**
 * POST /analysis/investigation
 * Investigation/Credibility Assessment
 * 
 * Analyzes credibility, deception indicators, and truthfulness
 * for investigative purposes
 */
router.post(
  '/investigation',
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'image', maxCount: 1 }
  ]),
  async (req: Request, res: Response): Promise<void> => {
    let uploadedFiles: any = req.files;

    try {
      const files = uploadedFiles as any;

      if (!files || !files.audio || !files.image) {
        res.status(400).json({
          success: false,
          error: 'Missing required files. Please provide both audio and image files.'
        });
        return;
      }

      const audioPath = files.audio[0].path;
      const imagePath = files.image[0].path;
      const text = req.body.text || '';

      console.log('🔍 Starting investigation analysis...', {
        audio: audioPath,
        image: imagePath,
        hasText: !!text
      });

      const result = await flaskAIService.analyzeInvestigationMode({
        audioPath,
        imagePath,
        text
      });

      console.log('✓ Analysis complete');

      if (result.success) {
        sendSuccess(res, result.data);
      } else {
        sendError(res, result.message || 'Analysis completed with errors', 200);
      }

    } catch (error: any) {
      console.error('❌ Investigation analysis error:', error);
      sendError(res, error.message || 'Analysis failed', 500);

    } finally {
      cleanupFiles(uploadedFiles);
    }
  }
);

/**
 * GET /analysis/health
 * Check Flask API Health Status
 * 
 * Verifies that the Flask AI API is running and responding
 */
router.get('/health', async (req: Request, res: Response): Promise<void> => {
  try {
    const isHealthy = await flaskAIService.healthCheck();

    if (isHealthy) {
      sendSuccess(res, {
        status: 'healthy',
        flaskAPI: 'connected',
        timestamp: new Date().toISOString()
      });
    } else {
      sendError(res, 'Flask API is not responding', 503);
    }
  } catch (error: any) {
    console.error('Health check failed:', error);
    sendError(res, 'Unable to connect to Flask API', 503);
  }
});

/**
 * GET /analysis/info
 * Get API Information
 * 
 * Returns information about available AI modules and capabilities
 */
router.get('/info', async (req: Request, res: Response): Promise<void> => {
  try {
    const info = await flaskAIService.getAPIInfo();
    sendSuccess(res, info);
  } catch (error: any) {
    console.error('Failed to get API info:', error);
    sendError(res, 'Unable to retrieve API information', 500);
  }
});

/**
 * GET /analysis/cache
 * Get Cache Statistics
 * 
 * Returns information about cached analysis results
 */
router.get('/cache', (req: Request, res: Response): void => {
  try {
    const stats = flaskAIService.getCacheStats();
    sendSuccess(res, {
      cacheSize: stats.size,
      cachedItems: stats.keys.length,
      items: stats.keys
    });
  } catch (error: any) {
    console.error('Failed to get cache stats:', error);
    sendError(res, 'Unable to retrieve cache statistics', 500);
  }
});

/**
 * DELETE /analysis/cache
 * Clear Analysis Cache
 * 
 * Removes all cached analysis results
 */
router.delete('/cache', (req: Request, res: Response): void => {
  try {
    flaskAIService.clearCache();
    sendSuccess(res, {
      message: 'Cache cleared successfully'
    });
  } catch (error: any) {
    console.error('Failed to clear cache:', error);
    sendError(res, 'Unable to clear cache', 500);
  }
});

/**
 * Error Handler for Multer File Upload Errors
 * 
 * Properly handles:
 * - File too large
 * - Invalid file types
 * - Other multer errors
 */
router.use(
  (err: Error | MulterError, req: Request, res: Response, next: NextFunction): void => {
    // Handle multer-specific errors
    if (err instanceof MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        sendError(res, 'File too large. Maximum size is 50MB.', 413);
        return;
      }

      if (err.code === 'LIMIT_FILE_COUNT') {
        sendError(res, 'Too many files uploaded.', 400);
        return;
      }

      if (err.code === 'LIMIT_PART_COUNT') {
        sendError(res, 'Too many form fields.', 400);
        return;
      }

      sendError(res, `File upload error: ${err.message}`, 400);
      return;
    }

    // Handle custom validation errors
    if (err && err.message && err.message.includes('Invalid file type')) {
      sendError(res, err.message, 400);
      return;
    }

    // Handle other errors
    if (err) {
      console.error('Unexpected error:', err);
      sendError(res, err.message || 'An unexpected error occurred', 500);
      return;
    }

    // No error, continue to next middleware
    next();
  }
);

export default router;

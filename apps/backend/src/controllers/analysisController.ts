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
import { randomUUID } from 'crypto';
import { FlaskAIService } from '../services/FlaskAIService';
import { analysisRepository } from '../db/analysisRepository';

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
    let analysisId: string | null = null;

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

      // Create analysis record
      analysisId = createId();
      const userId = (req as any).user?.id || 'anonymous';
      
      await analysisRepository.createAnalysis({
        id: analysisId,
        userId,
        mode: 'BUSINESS',
        inputMethod: 'upload',
        fileUrl: files.image[0].path,
      });

      const audioPath = files.audio[0].path;
      const imagePath = files.image[0].path;
      const text = req.body.text || '';

      console.log('🔍 Starting business analysis...', {
        analysisId,
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

      // Store result in database
      if (result.success) {
        const analysisData = result.data || {};
        await analysisRepository.completeAnalysis(analysisId, {
          confidence: analysisData.confidence || 0.85,
          summary: analysisData.summary,
          faceAnalysis: analysisData.faceAnalysis,
          voiceAnalysis: analysisData.voiceAnalysis,
          credibilityAnalysis: analysisData.credibilityAnalysis,
          recommendations: analysisData.recommendations || [
            'Maintain consistent eye contact',
            'Use deliberate hand gestures',
            'Speak at a steady pace'
          ],
        });

        // Return with analysis ID
        sendSuccess(res, {
          id: analysisId,
          mode: 'BUSINESS',
          ...result.data
        });
      } else {
        await analysisRepository.failAnalysis(analysisId, result.message || 'Analysis failed');
        sendError(res, result.message || 'Analysis completed with errors', 200);
      }

    } catch (error: any) {
      console.error('❌ Business analysis error:', error);
      if (analysisId) {
        await analysisRepository.failAnalysis(analysisId, error.message || 'Unexpected error');
      }
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
    let analysisId: string | null = null;

    try {
      const files = uploadedFiles as any;

      if (!files || !files.audio || !files.image) {
        res.status(400).json({
          success: false,
          error: 'Missing required files. Please provide both audio and image files.'
        });
        return;
      }

      // Create analysis record
      analysisId = createId();
      const userId = (req as any).user?.id || 'anonymous';

      await analysisRepository.createAnalysis({
        id: analysisId,
        userId,
        mode: 'HR',
        inputMethod: 'upload',
        fileUrl: files.image[0].path,
      });

      const audioPath = files.audio[0].path;
      const imagePath = files.image[0].path;
      const text = req.body.text || '';

      console.log('🔍 Starting HR analysis...', {
        analysisId,
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

      // Store result in database
      if (result.success) {
        const analysisData = result.data || {};
        await analysisRepository.completeAnalysis(analysisId, {
          confidence: analysisData.confidence || 0.85,
          summary: analysisData.summary,
          faceAnalysis: analysisData.faceAnalysis,
          voiceAnalysis: analysisData.voiceAnalysis,
          credibilityAnalysis: analysisData.credibilityAnalysis,
          recommendations: analysisData.recommendations || [
            'Monitor stress indicators',
            'Assess engagement level',
            'Review emotional consistency'
          ],
        });

        sendSuccess(res, {
          id: analysisId,
          mode: 'HR',
          ...result.data
        });
      } else {
        await analysisRepository.failAnalysis(analysisId, result.message || 'Analysis failed');
        sendError(res, result.message || 'Analysis completed with errors', 200);
      }

    } catch (error: any) {
      console.error('❌ HR analysis error:', error);
      if (analysisId) {
        await analysisRepository.failAnalysis(analysisId, error.message || 'Unexpected error');
      }
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
    let analysisId: string | null = null;

    try {
      const files = uploadedFiles as any;

      if (!files || !files.audio || !files.image) {
        res.status(400).json({
          success: false,
          error: 'Missing required files. Please provide both audio and image files.'
        });
        return;
      }

      // Create analysis record
      analysisId = createId();
      const userId = (req as any).user?.id || 'anonymous';

      await analysisRepository.createAnalysis({
        id: analysisId,
        userId,
        mode: 'INVESTIGATION',
        inputMethod: 'upload',
        fileUrl: files.image[0].path,
      });

      const audioPath = files.audio[0].path;
      const imagePath = files.image[0].path;
      const text = req.body.text || '';

      console.log('🔍 Starting investigation analysis...', {
        analysisId,
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

      // Store result in database
      if (result.success) {
        const analysisData = result.data || {};
        await analysisRepository.completeAnalysis(analysisId, {
          confidence: analysisData.confidence || 0.85,
          summary: analysisData.summary,
          faceAnalysis: analysisData.faceAnalysis,
          voiceAnalysis: analysisData.voiceAnalysis,
          credibilityAnalysis: analysisData.credibilityAnalysis,
          recommendations: analysisData.recommendations || [
            'Evaluate baseline behavior',
            'Note deviations from baseline',
            'Conduct follow-up interview'
          ],
        });

        sendSuccess(res, {
          id: analysisId,
          mode: 'INVESTIGATION',
          ...result.data
        });
      } else {
        await analysisRepository.failAnalysis(analysisId, result.message || 'Analysis failed');
        sendError(res, result.message || 'Analysis completed with errors', 200);
      }

    } catch (error: any) {
      console.error('❌ Investigation analysis error:', error);
      if (analysisId) {
        await analysisRepository.failAnalysis(analysisId, error.message || 'Unexpected error');
      }
      sendError(res, error.message || 'Analysis failed', 500);

    } finally {
      cleanupFiles(uploadedFiles);
    }
  }
);

/**
 * GET /analysis/:id
 * Get Analysis Result by ID
 * 
 * Retrieves a completed analysis with all results and metrics
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const analysis = await analysisRepository.getAnalysisById(id);

    if (!analysis) {
      res.status(404).json({
        success: false,
        error: 'Analysis not found'
      });
      return;
    }

    // Get associated metrics if completed
    const metrics = analysis.status === 'completed'
      ? await analysisRepository.getMetricsByAnalysisId(id)
      : [];

    sendSuccess(res, {
      analysis,
      metrics,
      isComplete: analysis.status === 'completed'
    });

  } catch (error: any) {
    console.error('Failed to fetch analysis:', error);
    sendError(res, error.message || 'Failed to fetch analysis', 500);
  }
});

/**
 * GET /analysis/user/:userId
 * Get User's Analyses
 * 
 * Retrieves all analyses for a specific user
 */
router.get('/user/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const analyses = await analysisRepository.getUserAnalyses(userId, limit);
    const stats = await analysisRepository.getUserStatistics(userId);

    sendSuccess(res, {
      analyses,
      statistics: stats,
      total: analyses.length
    });

  } catch (error: any) {
    console.error('Failed to fetch user analyses:', error);
    sendError(res, error.message || 'Failed to fetch analyses', 500);
  }
});

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
 * POST /analysis/live
 * Live Capture Analysis (Video + Audio blobs)
 * 
 * Accepts video and audio blobs from live capture,
 * stores them for processing, and returns analysis ID
 */
router.post(
  '/live',
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'audio', maxCount: 1 }
  ]),
  async (req: Request, res: Response): Promise<void> => {
    let uploadedFiles: any = req.files;
    let analysisId: string | null = null;

    try {
      const { mode } = req.body;
      const files = uploadedFiles as any;
      const userId = (req as any).user?.id || 'anonymous';

      // Validate mode
      if (!['business', 'hr', 'investigation'].includes(mode?.toLowerCase())) {
        res.status(400).json({
          success: false,
          error: 'Invalid mode. Must be business, hr, or investigation.'
        });
        return;
      }

      // Validate files
      if (!files || !files.video || !files.audio) {
        res.status(400).json({
          success: false,
          error: 'Missing required files. Please provide both video and audio.'
        });
        return;
      }

      // Create analysis record
      analysisId = randomUUID();
      const modeUpper = mode.toUpperCase();

      await analysisRepository.createAnalysis({
        id: analysisId,
        userId,
        mode: modeUpper === 'INVESTIGATION' ? 'INVESTIGATION' : (modeUpper === 'HR' ? 'HR' : 'BUSINESS'),
        inputMethod: 'live',
        videoUrl: files.video[0].path,
        audioUrl: files.audio[0].path,
      });

      const videoPath = files.video[0].path;
      const audioPath = files.audio[0].path;

      console.log('🎥 Starting live capture analysis...', {
        analysisId,
        mode: modeUpper,
        video: videoPath,
        audio: audioPath
      });

      // Call appropriate Flask analysis
      let result;

      switch (modeUpper) {
        case 'BUSINESS':
          result = await flaskAIService.analyzeBusinessMode({
            audioPath,
            imagePath: null,
            text: ''
          });
          break;
        case 'HR':
          result = await flaskAIService.analyzeHRMode({
            audioPath,
            imagePath: null,
            text: ''
          });
          break;
        case 'INVESTIGATION':
          result = await flaskAIService.analyzeInvestigationMode({
            audioPath,
            imagePath: null,
            text: ''
          });
          break;
        default:
          result = { success: false, message: 'Invalid mode' };
      }

      console.log('✓ Live analysis complete');

      // Store result in database
      if (result?.success) {
        const analysisData = result.data || {};
        await analysisRepository.completeAnalysis(analysisId, {
          confidence: analysisData.confidence || 0.85,
          summary: analysisData.summary,
          faceAnalysis: analysisData.faceAnalysis,
          voiceAnalysis: analysisData.voiceAnalysis,
          credibilityAnalysis: analysisData.credibilityAnalysis,
          recommendations: analysisData.recommendations || [],
        });

        sendSuccess(res, {
          id: analysisId,
          mode: modeUpper,
          status: 'completed',
          ...result.data,
          videoPath,
          audioPath,
          inputMethod: 'live'
        }, 201);
      } else {
        await analysisRepository.failAnalysis(analysisId, result?.message || 'Analysis failed');
        sendError(res, result?.message || 'Analysis completed with errors', 200);
      }

    } catch (error: any) {
      console.error('❌ Live analysis error:', error);
      if (analysisId) {
        await analysisRepository.failAnalysis(analysisId, error.message || 'Unexpected error');
      }
      sendError(res, error.message || 'Live analysis failed', 500);

    } finally {
      cleanupFiles(uploadedFiles);
    }
  }
);

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

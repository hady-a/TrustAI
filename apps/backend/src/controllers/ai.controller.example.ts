/**
 * Example: AI Analysis Controller
 * This demonstrates how to use the AI Service to integrate Flask AI models with the backend
 * 
 * Usage in your actual controller:
 * 
 * import { aiAnalysisService } from '../services/ai.service';
 * import { requireFlaskAPI } from '../middleware/flaskAPIHealth.middleware';
 * 
 * router.post('/api/analysis/full', requireFlaskAPI, async (req, res) => {
 *   // Your implementation here
 * });
 */

import { Request, Response } from 'express';
import { aiAnalysisService } from '../services/ai.service';
import { FileService } from '../services/file.service';
import { logger } from '../lib/logger';
import { AppError } from '../lib/AppError';
import path from 'path';

export class AIAnalysisExampleController {
  /**
   * Example 1: Run complete analysis with image and audio
   * 
   * POST /api/analysis/full
   * 
   * Form Data:
   * - image (file): Facial image
   * - audio (file): Audio recording
   * - report_type (string): general | hr | criminal | business
   */
  static async analyzeComplete(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      // Get uploaded files from multer
      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) {
        throw new AppError('No files uploaded', 400, 'NO_FILES');
      }

      const report_type = req.body.report_type || 'general';

      // Find image and audio files
      let imagePath: string | undefined;
      let audioPath: string | undefined;

      for (const file of files) {
        if (file.mimetype.startsWith('image/')) {
          imagePath = file.path;
        } else if (file.mimetype.startsWith('audio/')) {
          audioPath = file.path;
        }
      }

      logger.info({ userId, imagePath, audioPath, report_type }, 'Starting complete analysis');

      // Call Flask AI API
      const analysisResults = await aiAnalysisService.analyzeComplete(
        imagePath,
        audioPath,
        report_type,
        5 // video duration
      );

      // Store results in database
      // await saveToDatabaseOrQueue(userId, analysisResults);

      res.json({
        success: true,
        message: 'Analysis completed successfully',
        data: analysisResults.data,
        report_type: analysisResults.report_type,
      });
    } catch (error) {
      logger.error({ error }, 'Complete analysis failed');
      throw error;
    }
  }

  /**
   * Example 2: Facial analysis only
   * 
   * POST /api/analysis/face
   * 
   * Form Data:
   * - image (file): Facial image
   */
  static async analyzeFace(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) {
        throw new AppError('Image file is required', 400, 'NO_IMAGE');
      }

      const imageFile = files.find(f => f.mimetype.startsWith('image/'));
      if (!imageFile) {
        throw new AppError('No image file found', 400, 'NO_IMAGE');
      }

      logger.info({ userId, filePath: imageFile.path }, 'Starting face analysis');

      // Call Flask AI API
      const faceResults = await aiAnalysisService.analyzeFace(imageFile.path);

      res.json({
        success: true,
        message: 'Face analysis completed',
        data: faceResults.data,
      });
    } catch (error) {
      logger.error({ error }, 'Face analysis failed');
      throw error;
    }
  }

  /**
   * Example 3: Voice analysis only
   * 
   * POST /api/analysis/voice
   * 
   * Form Data:
   * - audio (file): Audio file
   */
  static async analyzeVoice(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) {
        throw new AppError('Audio file is required', 400, 'NO_AUDIO');
      }

      const audioFile = files.find(f => f.mimetype.startsWith('audio/'));
      if (!audioFile) {
        throw new AppError('No audio file found', 400, 'NO_AUDIO');
      }

      logger.info({ userId, filePath: audioFile.path }, 'Starting voice analysis');

      // Call Flask AI API
      const voiceResults = await aiAnalysisService.analyzeVoice(audioFile.path);

      res.json({
        success: true,
        message: 'Voice analysis completed',
        data: voiceResults.data,
      });
    } catch (error) {
      logger.error({ error }, 'Voice analysis failed');
      throw error;
    }
  }

  /**
   * Example 4: Generate report from analysis data
   * 
   * POST /api/analysis/report
   * 
   * JSON Body:
   * {
   *   "face_data": { ... },
   *   "voice_data": { ... },
   *   "credibility_data": { ... },
   *   "report_type": "hr"
   * }
   */
  static async generateReport(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const { face_data, voice_data, credibility_data, report_type = 'general' } = req.body;

      logger.info({ userId, report_type }, 'Generating report');

      // Call Flask AI API
      const reportResults = await aiAnalysisService.generateReport(
        face_data,
        voice_data,
        credibility_data,
        report_type
      );

      res.json({
        success: true,
        message: 'Report generated successfully',
        data: reportResults.data,
        report_type: reportResults.report_type,
      });
    } catch (error) {
      logger.error({ error }, 'Report generation failed');
      throw error;
    }
  }

  /**
   * Example 5: Check Flask API connection status
   * 
   * GET /api/analysis/status
   */
  static async getStatus(req: Request, res: Response) {
    try {
      const isHealthy = await aiAnalysisService.healthCheck();
      const status = isHealthy ? await aiAnalysisService.getStatus() : null;

      res.json({
        success: true,
        flask_api: {
          available: isHealthy,
          status: status,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Failed to get Flask API status');
      res.status(503).json({
        success: false,
        error: 'Could not connect to Flask API',
      });
    }
  }

  /**
   * Example 6: With job queue (for long-running tasks)
   * 
   * This example shows how to queue the analysis for async processing
   */
  static async analyzeWithQueue(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) {
        throw new AppError('No files uploaded', 400, 'NO_FILES');
      }

      // Extract image and audio paths
      let imagePath: string | undefined;
      let audioPath: string | undefined;

      for (const file of files) {
        if (file.mimetype.startsWith('image/')) {
          imagePath = file.path;
        } else if (file.mimetype.startsWith('audio/')) {
          audioPath = file.path;
        }
      }

      // Queue the job instead of running synchronously
      // const job = await analysisQueue.add({
      //   userId,
      //   imagePath,
      //   audioPath,
      //   report_type: req.body.report_type || 'general',
      // });

      // Respond immediately with job ID
      res.json({
        success: true,
        message: 'Analysis queued for processing',
        job_id: 'placeholder-job-id', // job.id
        status: 'QUEUED',
      });
    } catch (error) {
      logger.error({ error }, 'Failed to queue analysis');
      throw error;
    }
  }
}

/**
 * Example Routes Setup
 * 
 * Add these routes to your analysis.routes.ts:
 * 
 * import { AIAnalysisExampleController } from '../controllers/ai.controller.example';
 * import { requireAuth } from '../middleware/auth.middleware';
 * import { requireFlaskAPI } from '../middleware/flaskAPIHealth.middleware';
 * import { upload } from '../middleware/upload.middleware';
 * 
 * const router = Router();
 * 
 * // Full analysis with files
 * router.post(
 *   '/full',
 *   requireAuth,
 *   requireFlaskAPI,
 *   upload.array('files', 2),
 *   AIAnalysisExampleController.analyzeComplete
 * );
 * 
 * // Face analysis only
 * router.post(
 *   '/face',
 *   requireAuth,
 *   requireFlaskAPI,
 *   upload.single('image'),
 *   AIAnalysisExampleController.analyzeFace
 * );
 * 
 * // Voice analysis only
 * router.post(
 *   '/voice',
 *   requireAuth,
 *   requireFlaskAPI,
 *   upload.single('audio'),
 *   AIAnalysisExampleController.analyzeVoice
 * );
 * 
 * // Generate report
 * router.post(
 *   '/report',
 *   requireAuth,
 *   requireFlaskAPI,
 *   AIAnalysisExampleController.generateReport
 * );
 * 
 * // Check status
 * router.get(
 *   '/status',
 *   requireAuth,
 *   AIAnalysisExampleController.getStatus
 * );
 * 
 * export default router;
 */

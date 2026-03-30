import { Request, Response } from 'express';
import { businessAnalysisService } from '../services/business-analysis.service';
import { logger } from '../lib/logger';
import { AppError } from '../lib/AppError';

/**
 * Business Analysis Controller
 * Handles HTTP requests for business analysis endpoint
 * Integrates with Flask AI service for analysis processing
 */

export class BusinessAnalysisController {
  /**
   * Analyze business data
   * POST /api/analysis/business
   *
   * Request:
   * - audio (required): audio file
   * - image (optional): image file
   * - text (optional): text input
   *
   * Response:
   * {
   *   success: true,
   *   message: "Analysis completed",
   *   data: { ...AI results... }
   * }
   */
  static async analyzeBusiness(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    const startTime = Date.now();

    try {
      // Extract files from multer
      const files = req.files as any;
      const { text } = req.body;

      // Log incoming request
      logger.info(
        {
          userId,
          hasAudio: !!files?.audio,
          hasImage: !!files?.image,
          hasText: !!text,
          audioSize: files?.audio?.[0]?.size,
          imageSize: files?.image?.[0]?.size,
        },
        '[Business Analysis] Request received'
      );

      // Validate required files
      if (!files?.audio || files.audio.length === 0) {
        logger.warn(
          { userId },
          '[Business Analysis] Missing required audio file'
        );
        throw new AppError(
          'Audio file is required',
          400,
          'MISSING_AUDIO_FILE'
        );
      }

      // Extract file data (multer stores as array with 'fields' option)
      const audioFile = files.audio[0];
      const imageFile = files.image?.[0];

      logger.debug(
        {
          userId,
          audioFilename: audioFile.originalname,
          imageFilename: imageFile?.originalname,
        },
        '[Business Analysis] Files extracted'
      );

      // Call business analysis service
      logger.info(
        { userId },
        '[Business Analysis] Sending to Flask AI service'
      );

      const analysisResult = await businessAnalysisService.analyzeBusiness({
        audioFile,
        imageFile,
        text: text || undefined,
      });

      // Check if analysis succeeded
      if (!analysisResult.success) {
        logger.error(
          {
            userId,
            error: analysisResult.error,
            processingTime: Date.now() - startTime,
          },
          '[Business Analysis] Flask analysis failed'
        );

        res.status(400).json({
          success: false,
          error: analysisResult.error || 'Analysis failed',
        });
        return;
      }

      // Success response
      const processingTime = Date.now() - startTime;

      logger.info(
        {
          userId,
          processingTime,
          resultSize: JSON.stringify(analysisResult.data).length,
        },
        '[Business Analysis] Analysis completed successfully'
      );

      res.status(200).json({
        success: true,
        message: 'Analysis completed successfully',
        data: analysisResult.data,
        processingTime,
      });
    } catch (error) {
      const err = error as Error;
      const processingTime = Date.now() - startTime;

      logger.error(
        {
          userId,
          error: err.message,
          stack: err.stack,
          processingTime,
        },
        '[Business Analysis] Controller error'
      );

      // Handle AppError (custom error class)
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: error.errorCode,
        });
        return;
      }

      // Generic error response
      res.status(500).json({
        success: false,
        error: 'Internal server error during analysis',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  }

  /**
   * Health check endpoint
   * POST /api/analysis/business/health
   * Verifies that Flask API is running and responsive
   */
  static async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      logger.debug('[Business Analysis] Health check requested');

      const isHealthy = await businessAnalysisService.healthCheck();

      res.status(isHealthy ? 200 : 503).json({
        success: isHealthy,
        status: isHealthy ? 'healthy' : 'unavailable',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(
        { error: (error as Error).message },
        '[Business Analysis] Health check error'
      );

      res.status(503).json({
        success: false,
        status: 'error',
        message: (error as Error).message,
      });
    }
  }
}

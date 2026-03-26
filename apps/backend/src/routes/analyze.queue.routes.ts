import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { analysisLimiter, uploadLimiter } from '../middleware/rateLimiter.middleware';
import { upload, validateFileUpload, handleMulterError } from '../middleware/upload.middleware';
import { asyncHandler, ValidationError, ServiceUnavailableError } from '../middleware/error.middleware';
import { analysisQueueService } from '../services/analysis.queue.service';
import { fileUploadService } from '../services/file.upload.service';
import { flaskAIService } from '../services/flask.ai.service';
import { logger } from '../config/logger';
import { redisClient } from '../config/queue';
import { randomUUID } from 'crypto';
import { hasAudioFile, getFirstAudioFile, hasImageFile, getFirstImageFile } from '../utils/file.utils';

const router = Router();

/**
 * POST /api/analyze/business
 *
 * Business Analysis Endpoint
 * Modes: BUSINESS, CRIMINAL, INTERVIEW
 *
 * Accepts:
 * - audio file (optional): recorded voice
 * - image file (optional): facial image
 * - text input (optional): interview text
 *
 * Returns:
 * {
 *   success: true,
 *   jobId: string,
 *   analysisId: string,
 *   status: "queued",
 *   estimatedWaitTime: number (seconds),
 *   pollUrl: string
 * }
 *
 * Use jobId to poll: GET /api/analyze/:jobId/status
 */
router.post(
  '/business',
  requireAuth,
  uploadLimiter,
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'image', maxCount: 1 },
  ]),
  handleMulterError,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const mode = 'BUSINESS';

    // Validate at least one input is provided
    const hasAudio = hasAudioFile(req);
    const hasImage = hasImageFile(req);
    const hasText = req.body.text && req.body.text.trim().length > 0;

    logger.info(
      {
        userId,
        mode,
        hasAudio,
        hasImage,
        hasText,
      },
      'Business analysis request received'
    );

    if (!hasAudio && !hasImage && !hasText) {
      throw new ValidationError(
        'At least one input is required: audio file, image file, or text',
        { hasAudio, hasImage, hasText }
      );
    }

    // Validate text input if provided
    if (hasText && req.body.text.length > 5000) {
      throw new ValidationError('Text input exceeds maximum length of 5000 characters');
    }

    // Check Flask API availability
    const flaskHealthy = await flaskAIService.healthCheck();
    if (!flaskHealthy) {
      throw new ServiceUnavailableError(
        'AI service is temporarily unavailable. Please try again soon.'
      );
    }

    // Process files
    let audioPath: string | undefined;
    let imagePath: string | undefined;
    const fileId = randomUUID();

    try {
      // Save audio file if provided
      if (hasAudio) {
        const audioFile = getFirstAudioFile(req);
        if (!audioFile) {
          throw new ValidationError('Audio file is missing');
        }

        // Validate file
        const validation = fileUploadService.validateFile(
          audioFile.buffer,
          'audio',
          audioFile.mimetype,
          audioFile.originalname
        );

        if (!validation.valid) {
          throw new ValidationError(validation.error || 'Audio file validation failed');
        }

        audioPath = await fileUploadService.saveUploadedFile(
          audioFile.buffer,
          'audio',
          `${fileId}-audio`,
          audioFile.originalname
        );

        logger.debug({ audioPath, size: audioFile.size }, 'Audio file saved');
      }

      // Save image file if provided
      if (hasImage) {
        const imageFile = getFirstImageFile(req);
        if (!imageFile) {
          throw new ValidationError('Image file is missing');
        }

        // Validate file
        const validation = fileUploadService.validateFile(
          imageFile.buffer,
          'image',
          imageFile.mimetype,
          imageFile.originalname
        );

        if (!validation.valid) {
          throw new ValidationError(validation.error || 'Image file validation failed');
        }

        imagePath = await fileUploadService.saveUploadedFile(
          imageFile.buffer,
          'image',
          `${fileId}-image`,
          imageFile.originalname
        );

        logger.debug({ imagePath, size: imageFile.size }, 'Image file saved');
      }

      // Queue the analysis job
      const { jobId, analysisId, estimatedWaitTime } = await analysisQueueService.createAnalysisJob({
        userId,
        mode: 'BUSINESS',
        inputMethod: hasAudio || hasImage ? 'upload' : 'text',
        audioPath,
        imagePath,
        textInput: req.body.text,
      });

      logger.info(
        {
          jobId,
          analysisId,
          userId,
          estimatedWaitTime,
        },
        'Analysis job queued successfully'
      );

      // Return response with polling information
      return res.status(202).json({
        success: true,
        jobId,
        analysisId,
        status: 'queued',
        estimatedWaitTime,
        pollUrl: `/api/analyze/${jobId}/status`,
        message: 'Analysis queued. Use the jobId to check status.',
      });
    } catch (error) {
      // Cleanup files on error
      if (audioPath) {
        await fileUploadService.deleteFile(audioPath);
      }
      if (imagePath) {
        await fileUploadService.deleteFile(imagePath);
      }

      throw error;
    }
  })
);

/**
 * POST /api/analyze/criminal
 * Same as business but mode=CRIMINAL
 */
router.post(
  '/criminal',
  requireAuth,
  uploadLimiter,
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'image', maxCount: 1 },
  ]),
  handleMulterError,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const mode = 'CRIMINAL';

    // Validate at least one input
    const hasAudio = hasAudioFile(req);
    const hasImage = hasImageFile(req);
    const hasText = req.body.text && req.body.text.trim().length > 0;

    logger.info(
      {
        userId,
        mode,
        hasAudio,
        hasImage,
        hasText,
      },
      'Criminal investigation request received'
    );

    if (!hasAudio && !hasImage && !hasText) {
      throw new ValidationError(
        'At least one input is required: audio file, image file, or text'
      );
    }

    const flaskHealthy = await flaskAIService.healthCheck();
    if (!flaskHealthy) {
      throw new ServiceUnavailableError('AI service is temporarily unavailable');
    }

    let audioPath: string | undefined;
    let imagePath: string | undefined;
    const fileId = randomUUID();

    try {
      if (hasAudio) {
        const audioFile = getFirstAudioFile(req);
        if (!audioFile) {
          throw new ValidationError('Audio file is missing');
        }
        const validation = fileUploadService.validateFile(
          audioFile.buffer,
          'audio',
          audioFile.mimetype,
          audioFile.originalname
        );
        if (!validation.valid) {
          throw new ValidationError(validation.error || 'Audio file validation failed');
        }

        audioPath = await fileUploadService.saveUploadedFile(
          audioFile.buffer,
          'audio',
          `${fileId}-audio`,
          audioFile.originalname
        );
      }

      if (hasImage) {
        const imageFile = getFirstImageFile(req);
        if (!imageFile) {
          throw new ValidationError('Image file is missing');
        }
        const validation = fileUploadService.validateFile(
          imageFile.buffer,
          'image',
          imageFile.mimetype,
          imageFile.originalname
        );
        if (!validation.valid) {
          throw new ValidationError(validation.error || 'Image file validation failed');
        }

        imagePath = await fileUploadService.saveUploadedFile(
          imageFile.buffer,
          'image',
          `${fileId}-image`,
          imageFile.originalname
        );
      }

      const { jobId, analysisId, estimatedWaitTime } = await analysisQueueService.createAnalysisJob({
        userId,
        mode: 'CRIMINAL',
        inputMethod: hasAudio || hasImage ? 'upload' : 'text',
        audioPath,
        imagePath,
        textInput: req.body.text,
      });

      return res.status(202).json({
        success: true,
        jobId,
        analysisId,
        status: 'queued',
        estimatedWaitTime,
        pollUrl: `/api/analyze/${jobId}/status`,
        message: 'Analysis queued. Use the jobId to check status.',
      });
    } catch (error) {
      if (audioPath) await fileUploadService.deleteFile(audioPath);
      if (imagePath) await fileUploadService.deleteFile(imagePath);
      throw error;
    }
  })
);

/**
 * POST /api/analyze/interview
 * Same as business but mode=INTERVIEW
 */
router.post(
  '/interview',
  requireAuth,
  uploadLimiter,
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'image', maxCount: 1 },
  ]),
  handleMulterError,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const mode = 'INTERVIEW';

    // Validate at least one input
    const hasAudio = hasAudioFile(req);
    const hasImage = hasImageFile(req);
    const hasText = req.body.text && req.body.text.trim().length > 0;

    logger.info(
      {
        userId,
        mode,
        hasAudio,
        hasImage,
        hasText,
      },
      'Interview analysis request received'
    );

    if (!hasAudio && !hasImage && !hasText) {
      throw new ValidationError(
        'At least one input is required: audio file, image file, or text'
      );
    }

    const flaskHealthy = await flaskAIService.healthCheck();
    if (!flaskHealthy) {
      throw new ServiceUnavailableError('AI service is temporarily unavailable');
    }

    let audioPath: string | undefined;
    let imagePath: string | undefined;
    const fileId = randomUUID();

    try {
      if (hasAudio) {
        const audioFile = getFirstAudioFile(req);
        if (!audioFile) {
          throw new ValidationError('Audio file is missing');
        }
        const validation = fileUploadService.validateFile(
          audioFile.buffer,
          'audio',
          audioFile.mimetype,
          audioFile.originalname
        );
        if (!validation.valid) {
          throw new ValidationError(validation.error || 'Audio file validation failed');
        }

        audioPath = await fileUploadService.saveUploadedFile(
          audioFile.buffer,
          'audio',
          `${fileId}-audio`,
          audioFile.originalname
        );
      }

      if (hasImage) {
        const imageFile = getFirstImageFile(req);
        if (!imageFile) {
          throw new ValidationError('Image file is missing');
        }
        const validation = fileUploadService.validateFile(
          imageFile.buffer,
          'image',
          imageFile.mimetype,
          imageFile.originalname
        );
        if (!validation.valid) {
          throw new ValidationError(validation.error || 'Image file validation failed');
        }

        imagePath = await fileUploadService.saveUploadedFile(
          imageFile.buffer,
          'image',
          `${fileId}-image`,
          imageFile.originalname
        );
      }

      const { jobId, analysisId, estimatedWaitTime } = await analysisQueueService.createAnalysisJob({
        userId,
        mode: 'INTERVIEW',
        inputMethod: hasAudio || hasImage ? 'upload' : 'text',
        audioPath,
        imagePath,
        textInput: req.body.text,
      });

      return res.status(202).json({
        success: true,
        jobId,
        analysisId,
        status: 'queued',
        estimatedWaitTime,
        pollUrl: `/api/analyze/${jobId}/status`,
        message: 'Analysis queued. Use the jobId to check status.',
      });
    } catch (error) {
      if (audioPath) await fileUploadService.deleteFile(audioPath);
      if (imagePath) await fileUploadService.deleteFile(imagePath);
      throw error;
    }
  })
);

/**
 * GET /api/analyze/:jobId/status
 *
 * Poll for analysis status
 * Returns current state, progress, and result when ready
 */
router.get(
  '/:jobId/status',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { jobId } = req.params;

    const jobStatus = await analysisQueueService.getJobStatus(jobId);

    if (!jobStatus) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    // If completed, fetch result
    let result = null;
    if (jobStatus.status === 'completed') {
      result = await analysisQueueService.getJobResult(jobId);
    }

    return res.status(200).json({
      success: true,
      jobId,
      analysisId: jobStatus.analysisId,
      status: jobStatus.status,
      progress: jobStatus.progress,
      state: jobStatus.state,
      result,
      failedReason: jobStatus.failedReason,
      createdAt: new Date(jobStatus.createdAt).toISOString(),
      completedAt: jobStatus.completedAt ? new Date(jobStatus.completedAt).toISOString() : null,
    });
  })
);

/**
 * GET /api/analyze/queue/status
 *
 * Get overall queue statistics
 * Useful for monitoring and debugging
 */
router.get(
  '/queue/stats',
  requireAuth,
  asyncHandler(async (_req: Request, res: Response) => {
    const stats = await analysisQueueService.getQueueStats();

    return res.status(200).json({
      success: true,
      queue: stats,
    });
  })
);

/**
 * Health Check for analysis service
 */
router.get(
  '/health/check',
  asyncHandler(async (_req: Request, res: Response) => {
    const flaskHealth = await flaskAIService.healthCheck();
    const redisHealth = redisClient.status === 'ready';
    const overall = flaskHealth && redisHealth;

    return res.status(overall ? 200 : 503).json({
      success: overall,
      services: {
        flask: flaskHealth,
        redis: redisHealth,
      },
    });
  })
);

export default router;

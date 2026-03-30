import { Router, Request, Response, NextFunction } from 'express';
import { BusinessAnalysisController } from '../controllers/business-analysis.controller';
import {
  businessAnalysisUpload,
  validateBusinessAnalysisUpload,
  handleBusinessAnalysisMulterError,
} from '../middleware/business-analysis-upload.middleware';
import { requireAuth } from '../middleware/auth.middleware';
import { uploadLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

/**
 * POST /api/analysis/business
 * Business analysis endpoint with file uploads
 *
 * Accepts:
 * - audio (required): audio file
 * - image (optional): image file
 * - text (optional): text input
 *
 * Returns:
 * {
 *   success: true,
 *   message: "Analysis completed successfully",
 *   data: { ...AI analysis results... },
 *   processingTime: number
 * }
 */
router.post(
  '/',
  requireAuth, // Require authentication
  uploadLimiter, // Rate limit file uploads
  businessAnalysisUpload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'image', maxCount: 1 },
  ]), // Handle file uploads
  handleBusinessAnalysisMulterError, // Handle multer errors
  validateBusinessAnalysisUpload, // Validate uploads
  BusinessAnalysisController.analyzeBusiness // Process analysis
);

/**
 * GET /api/analysis/business/health
 * Health check endpoint
 * Verifies Flask API connectivity
 */
router.get(
  '/health',
  BusinessAnalysisController.healthCheck
);

export default router;

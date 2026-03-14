import { Router, Request, Response, NextFunction } from 'express';
import { AnalysisController } from '../controllers/analysis.controller';
import { requireAuth } from '../middleware/auth.middleware';
import {
  analysisLimiter,
  uploadLimiter,
} from '../middleware/rateLimiter.middleware';
import {
  upload,
  validateFileUpload,
  handleMulterError,
} from '../middleware/upload.middleware';

const router = Router();

// Create analysis from URL (rate limited)
router.post('/', requireAuth, analysisLimiter, AnalysisController.createAnalysis);

// Create analysis with file uploads (rate limited)
router.post(
  '/upload',
  requireAuth,
  uploadLimiter,
  upload.array('files', 5),
  handleMulterError,
  validateFileUpload,
  AnalysisController.createAnalysisWithUpload
);

// Get analysis status timeline
router.get('/:analysisId/status-history', requireAuth, AnalysisController.getAnalysisStatusHistory);

// Get analysis logs from database
router.get('/:analysisId/logs', requireAuth, AnalysisController.getAnalysisLogs);

// Get files for an analysis
router.get('/:analysisId/files', requireAuth, AnalysisController.getAnalysisFiles);

// Delete a specific file from analysis
router.delete('/files/:fileId', requireAuth, AnalysisController.deleteAnalysisFile);

export default router;

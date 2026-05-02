/**
 * TrustAI Backend - Legacy Analysis Controller (Deprecated)
 * 
 * ⚠️ DEPRECATED - This controller is for backward compatibility only
 * 
 * For new implementations, use the new async queue-based API:
 * - POST /api/analyze/business
 * - POST /api/analyze/criminal  
 * - POST /api/analyze/interview
 * 
 * Location: src/routes/analyze.queue.routes.ts
 */

import { Router, Request, Response } from 'express';
import { logger } from '../config/logger';

const analysisRouter = Router();

/**
 * POST / - Legacy endpoint redirects to new API
 */
analysisRouter.post('/', async (req: Request, res: Response) => {
  logger.warn(
    { endpoint: '/analysis', method: 'POST' },
    'Legacy analysis endpoint - use /api/analyze/{mode} instead'
  );

  res.status(301).json({
    success: false,
    message: 'Endpoint deprecated',
    redirect: '/api/analyze/business',
    note: 'Use new async queue-based API'
  });
});

/**
 * GET /health - Service health check
 */
analysisRouter.get('/health', (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    service: 'TrustAI Backend'
  });
});

/**
 * GET /info - API information
 */
analysisRouter.get('/info', (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    api: 'TrustAI Analysis API v2',
    endpoints: [
      'POST /api/analyze/business',
      'POST /api/analyze/criminal',
      'POST /api/analyze/interview',
      'GET /api/analyze/:jobId/status'
    ]
  });
});

/**
 * Catch-all for unknown routes
 */
analysisRouter.use('*', (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: 'Not found'
  });
});

export default analysisRouter;

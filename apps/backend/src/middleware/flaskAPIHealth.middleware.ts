/**
 * Flask AI API Health Check Middleware
 * Validates connection to Flask AI API at startup
 */

import { Request, Response, NextFunction } from 'express';
import { aiAnalysisService } from '../services/ai.service';
import { logger } from '../lib/logger';

let flaskAPIHealthy = false;

/**
 * Initialize Flask AI API connection check
 */
export async function initializeFlaskConnection(): Promise<void> {
  try {
    logger.info('Checking Flask AI API connection...');
    const isConnected = await aiAnalysisService.validateConnection();

    if (isConnected) {
      flaskAPIHealthy = true;
      logger.info('✅ Flask AI API is connected and healthy');
    } else {
      flaskAPIHealthy = false;
      logger.warn('⚠️ Flask AI API is not available - continue with graceful degradation');
    }
  } catch (error) {
    flaskAPIHealthy = false;
    logger.error(
      { error },
      '⚠️ Failed to connect to Flask AI API - continue with graceful degradation'
    );
  }
}

/**
 * Middleware to check if Flask API is available
 * If not available, returns error response
 */
export function requireFlaskAPI(req: Request, res: Response, next: NextFunction): void {
  if (!flaskAPIHealthy) {
    res.status(503).json({
      success: false,
      error: 'AI Analysis Service is currently unavailable',
      message: 'The Flask AI API is not connected. Please ensure it is running.',
    });
    return;
  }
  next();
}

/**
 * Middleware to check Flask API but allow graceful degradation
 */
export function checkFlaskAPI(req: Request, res: Response, next: NextFunction): void {
  if (!flaskAPIHealthy) {
    logger.warn('Flask AI API is not available - using graceful degradation');
  }
  (req as any).flaskAPIAvailable = flaskAPIHealthy;
  next();
}

/**
 * Get Flask API health status
 */
export function isFlaskAPIHealthy(): boolean {
  return flaskAPIHealthy;
}

/**
 * Set Flask API health status (for testing)
 */
export function setFlaskAPIHealth(status: boolean): void {
  flaskAPIHealthy = status;
}

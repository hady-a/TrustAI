import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { logger } from '../lib/logger';

// Extend Express Request to include rateLimit property
declare global {
  namespace Express {
    interface Request {
      rateLimit?: {
        limit: number;
        current: number;
        remaining: number;
        resetTime?: Date;
      };
    }
  }
}

/**
 * Rate Limiters Configuration
 * Uses in-memory storage for development/testing
 * For production with horizontal scaling, implement Redis store
 */

/**
 * Helper: Get client IP safely (handles IPv4, IPv6, and proxies)
 */
const getClientIp = (req: any): string => {
  // Check for IP from various headers (proxy headers)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = typeof forwarded === 'string' ? forwarded.split(',') : forwarded;
    return (Array.isArray(ips) ? ips[0] : forwarded).trim();
  }
  
  // Fallback to direct connection
  return req.socket?.remoteAddress || req.connection?.remoteAddress || req.ip || '127.0.0.1';
};

/**
 * Auth rate limiter: 60 requests per minute per IP
 * Increased for development - adjust for production
 */
export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  message: 'Too many login attempts, please try again later',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for admin health checks
    return req.path === '/health' || req.path === '/health/ready';
  },
  keyGenerator: (req) => {
    // Rate limit by IP and email to prevent account enumeration
    const ipKey = getClientIp(req);
    const email = req.body?.email || 'unknown';
    return `${ipKey}:${email}`;
  },
  handler: (req, res) => {
    logger.warn(
      { ip: req.ip, email: req.body?.email },
      'Auth rate limit exceeded'
    );
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again in 1 minute.',
      retryAfter: new Date(Date.now() + 60000),
    });
  },
});

/**
 * Analysis creation limiter: 50 analyses per minute per user
 * Increased for development - adjust for production
 */
export const analysisLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50,
  message: 'Too many analyses created. Please wait before starting a new analysis.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by authenticated user ID, fallback to IP
    if (req.user?.id) {
      return `user:${req.user.id}`;
    }
    return getClientIp(req);
  },
  handler: (req, res) => {
    logger.warn(
      { userId: req.user?.id, ip: req.ip },
      'Analysis rate limit exceeded'
    );
    res.status(429).json({
      success: false,
      message: 'Too many analyses created. Please wait 1 minute before starting another.',
      retryAfter: new Date(Date.now() + 60000),
    });
  },
});

/**
 * General API limiter: 500 requests per minute per IP
 * Increased for development - adjust for production
 */
export const generalLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 500,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by user ID if authenticated, otherwise by IP
    if (req.user?.id) {
      return `user:${req.user.id}`;
    }
    return getClientIp(req);
  },
  handler: (req, res) => {
    logger.warn(
      { userId: req.user?.id, ip: req.ip, path: req.path },
      'General rate limit exceeded'
    );
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      retryAfter: new Date(Date.now() + 60000),
    });
  },
});

/**
 * Upload file limiter: 100 uploads per minute per user
 * Increased for development - adjust for production
 */
export const uploadLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: 'Too many file uploads. Please wait before uploading more files.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by user ID if authenticated, otherwise by IP
    if (req.user?.id) {
      return `user:${req.user.id}`;
    }
    return getClientIp(req);
  },
  handler: (req, res) => {
    logger.warn(
      { userId: req.user?.id, ip: req.ip },
      'Upload rate limit exceeded'
    );
    res.status(429).json({
      success: false,
      message: 'Too many file uploads. Please wait 1 minute before uploading more.',
      retryAfter: new Date(Date.now() + 60000),
    });
  },
});

/**
 * Cleanup function for rate limiters
 * (In-memory store requires no cleanup)
 */
export const cleanupRateLimiters = async () => {
  // No cleanup needed for in-memory store
  logger.info('Rate limiters cleaned up');
};

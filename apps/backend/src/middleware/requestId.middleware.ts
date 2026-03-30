import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request ID Middleware
 * 
 * Generates a unique ID for each request and attaches it to req.id
 * Enables request tracing across logs and error responses
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Generate unique ID for this request
  const requestId = uuidv4();
  
  // Attach to request object for use in handlers
  (req as any).id = requestId;
  
  // Also set response header for client tracking
  res.setHeader('X-Request-ID', requestId);
  
  next();
};

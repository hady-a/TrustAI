import { Request, Response, NextFunction } from 'express';
import { logError } from '../config/logger';
import { logger } from '../config/logger';

/**
 * Structured Error Response
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Custom Application Errors
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code: string = 'INTERNAL_ERROR',
    public details?: Record<string, any>
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Specific error types
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: Record<string, any>) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', details);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE');
  }
}

export class TimeoutError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 504, 'TIMEOUT', details);
  }
}

/**
 * Global Error Handler Middleware
 * Catches all errors and returns structured responses
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  const requestId = (req as any).id || 'unknown';

  // Handle known AppErrors
  if (err instanceof AppError) {
    logError(err, {
      context: 'AppError',
      statusCode: err.statusCode,
      code: err.code,
      requestId,
      path: req.path,
      method: req.method,
    });

    const response: ErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    return res.status(err.statusCode).json(response);
  }

  // Handle multer errors
  if (err.name === 'MulterError') {
    let statusCode = 400;
    let code = 'FILE_UPLOAD_ERROR';
    let message = 'File upload failed';

    if ((err as any).code === 'FILE_TOO_LARGE') {
      message = 'File exceeds maximum size';
      code = 'FILE_TOO_LARGE';
    } else if ((err as any).code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files uploaded';
      code = 'LIMIT_FILE_COUNT';
    } else if ((err as any).code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds limit';
      code = 'FILE_TOO_LARGE';
    }

    const response: ErrorResponse = {
      success: false,
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    return res.status(statusCode).json(response);
  }

  // Handle timeout errors
  if (err.message.includes('timeout') || err.message.includes('TIMEOUT')) {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: 'REQUEST_TIMEOUT',
        message: 'Request timeout - operation took too long',
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    return res.status(504).json(response);
  }

  // Handle unknown errors
  logError(err, {
    context: 'UnknownError',
    requestId,
    path: req.path,
    method: req.method,
    userId: (req as any).user?.id || 'anonymous',
  });

  const response: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  res.status(500).json(response);
};

/**
 * Async Error Handler Wrapper
 * Wraps async route handlers and passes caught errors to errorHandler
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default errorHandler;

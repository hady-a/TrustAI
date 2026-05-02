/**
 * Centralized Application Error Class
 * 
 * Extended by all application-specific errors.
 * Provides structured error handling with HTTP status codes.
 * 
 * Uses:
 * - Controllers: throw new AppError('message', 400)
 * - Controllers: throw new AppError('message', 400, 'ERROR_CODE')
 * - Services: throw new AppError('message', 500)
 * - Middleware: throw new AppError('message', 401)
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode?: string,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;

    // Ensure error name matches class name for better debugging
    this.name = this.constructor.name;

    // Capture stack trace for better error tracking and debugging
    Error.captureStackTrace(this, this.constructor);
  }
}

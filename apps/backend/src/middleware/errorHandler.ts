import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/AppError';
import { logger } from '../lib/logger';
import { ZodError } from 'zod';
import multer from 'multer';

/**
 * Enhanced Express Error Handler Middleware
 * 
 * Features:
 * - Request ID tracking (unique per request)
 * - Multer file upload error detection
 * - Timeout error detection
 * - Structured error responses
 * - Maintains existing AppError and ZodError handling
 */
export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const requestId = (req as any).id || 'unknown';
    
    logger.error({
        err,
        path: req.path,
        method: req.method,
        requestId,
    }, err.message);

    // ========================================================================
    // 1. MULTER FILE UPLOAD ERRORS
    // ========================================================================
    if (err instanceof multer.MulterError) {
        const statusCode = 400;
        let message = 'File upload error';

        switch (err.code) {
            case 'LIMIT_PART_COUNT':
                message = 'Too many form fields';
                break;
            case 'LIMIT_FILE_SIZE':
                message = 'File size exceeds limit';
                break;
            case 'LIMIT_FILE_COUNT':
                message = 'Too many files uploaded';
                break;
            case 'LIMIT_FIELD_KEY':
                message = 'Field name too long';
                break;
            case 'LIMIT_FIELD_VALUE':
                message = 'Field value too large';
                break;
            default:
                message = err.message || 'File upload error';
        }

        return res.status(statusCode).json({
            success: false,
            message,
            errorCode: 'MULTER_ERROR',
            requestId,
        });
    }

    // ========================================================================
    // 2. TIMEOUT ERRORS
    // ========================================================================
    // Express timeout errors have specific patterns
    if (
        err.name === 'TimeoutError' ||
        (err instanceof Error && err.message.includes('Request timeout')) ||
        (err instanceof Error && err.message.includes('socket hang up'))
    ) {
        return res.status(504).json({
            success: false,
            message: 'Request timeout - operation took too long',
            errorCode: 'REQUEST_TIMEOUT',
            requestId,
        });
    }

    // ========================================================================
    // 3. APPERROR - OPERATIONAL ERRORS
    // ========================================================================
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errorCode: err.errorCode,
            requestId,
        });
    }

    // ========================================================================
    // 4. ZOD VALIDATION ERRORS
    // ========================================================================
    if (err instanceof ZodError) {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: err.issues,
            errorCode: 'VALIDATION_ERROR',
            requestId,
        });
    }

    // ========================================================================
    // 5. DEFAULT - Internal Server Error
    // ========================================================================
    return res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        errorCode: 'INTERNAL_ERROR',
        requestId,
    });
};

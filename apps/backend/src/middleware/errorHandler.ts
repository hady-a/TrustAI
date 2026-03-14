import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/AppError';
import { logger } from '../lib/logger';
import { ZodError } from 'zod';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    logger.error({ err, path: req.path, method: req.method }, err.message);

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errorCode: err.errorCode,
        });
    }

    if (err instanceof ZodError) {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: err.issues,
            errorCode: 'VALIDATION_ERROR',
        });
    }

    // Default to 500 server error
    return res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        errorCode: 'INTERNAL_ERROR',
    });
};

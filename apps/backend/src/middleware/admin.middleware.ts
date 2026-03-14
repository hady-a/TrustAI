import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/AppError';

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new AppError('No authorization token provided', 401, 'NO_TOKEN');
  }

  if (req.user.role !== 'ADMIN') {
    throw new AppError('This action requires admin privileges', 403, 'FORBIDDEN');
  }

  next();
};

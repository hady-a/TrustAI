import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../lib/AppError';
import { getJWTSecret } from '../lib/jwt.utils';

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      console.log('No auth token found in headers:', req.headers);
      throw new AppError('No authorization token provided', 401, 'NO_TOKEN');
    }

    const decoded = jwt.verify(token, getJWTSecret()) as {
      id: string;
      email: string;
      role?: string;
    };
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
    }
    throw error;
  }
};

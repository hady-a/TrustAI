import jwt from 'jsonwebtoken';

// Get JWT secret with validation
export const getJWTSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
};

export interface TokenPayload {
  id: string;
  email: string;
  role?: string;
}

export const generateToken = (payload: TokenPayload, expiresIn: string = '15m'): string => {
  return jwt.sign(payload, getJWTSecret(), { expiresIn } as any);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, getJWTSecret(), { expiresIn: '7d' } as any);
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, getJWTSecret()) as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

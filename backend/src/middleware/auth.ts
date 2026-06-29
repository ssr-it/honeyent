import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/index.ts';
import { ApiError } from './errorHandler.ts';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        role: string;
      };
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new ApiError(401, 'No token provided');
    }

    const decoded = jwt.verify(token, config.jwt.secret || 'default_secret');
    req.user = decoded as any;
    next();
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired token');
  }
};

export const generateToken = (
  userId: string,
  username: string,
  role: string = 'admin'
): string => {
  return jwt.sign(
    { id: userId, username, role },
    config.jwt.secret || 'default_secret',
    {
      expiresIn: config.jwt.expire as SignOptions["expiresIn"],
    }
  );
};
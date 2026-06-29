import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../config/jwt';
import { AppError } from './errorHandler';
import { AuthenticatedRequest } from '../types';

export const protect = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Grant access and store decoded user details
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

export const restrictTo = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('User session not found.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  public statusCode: number;
  public errors?: any;

  constructor(message: string, statusCode: number, errors?: any) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  }

  // Handle Prisma Database Errors
  if (err.code) {
    switch (err.code) {
      case 'P2002': // Unique constraint violation
        statusCode = 409;
        message = `Duplicate field value: ${err.meta?.target || 'field'}`;
        break;
      case 'P2025': // Record not found
        statusCode = 404;
        message = 'Resource not found';
        break;
      default:
        console.error('Prisma Error Code:', err.code, err.message);
    }
  }

  // Handle JWT error
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please refresh your session.';
  }

  // Log server errors (500)
  if (statusCode === 500) {
    console.error('SERVER ERROR 💥:', err);
  }

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

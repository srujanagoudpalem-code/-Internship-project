"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
const zod_1 = require("zod");
class AppError extends Error {
    statusCode;
    errors;
    constructor(message, statusCode, errors) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let errors = err.errors || null;
    // Handle Zod Validation Errors
    if (err instanceof zod_1.ZodError) {
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
exports.errorHandler = errorHandler;

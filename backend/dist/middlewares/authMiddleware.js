"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restrictTo = exports.protect = void 0;
const jwt_1 = require("../config/jwt");
const errorHandler_1 = require("./errorHandler");
const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            return next(new errorHandler_1.AppError('You are not logged in. Please log in to get access.', 401));
        }
        // Verify token
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        // Grant access and store decoded user details
        req.user = decoded;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.protect = protect;
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errorHandler_1.AppError('User session not found.', 401));
        }
        if (!roles.includes(req.user.role)) {
            return next(new errorHandler_1.AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};
exports.restrictTo = restrictTo;

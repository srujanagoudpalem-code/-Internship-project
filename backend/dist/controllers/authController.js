"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.logout = exports.refresh = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const db_1 = __importDefault(require("../config/db"));
const jwt_1 = require("../config/jwt");
const errorHandler_1 = require("../middlewares/errorHandler");
const mailer_1 = require("../config/mailer");
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: 'Invalid email address' }),
    password: zod_1.z.string().min(6, { message: 'Password must be at least 6 characters' }),
    name: zod_1.z.string().min(2, { message: 'Name must be at least 2 characters' }),
    phone: zod_1.z.string().optional().nullable(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: 'Invalid email address' }),
    password: zod_1.z.string().min(1, { message: 'Password is required' }),
});
const register = async (req, res, next) => {
    try {
        const validated = registerSchema.parse(req.body);
        const existingUser = await db_1.default.user.findUnique({
            where: { email: validated.email },
        });
        if (existingUser) {
            return next(new errorHandler_1.AppError('Email already in use', 409));
        }
        const passwordHash = await bcryptjs_1.default.hash(validated.password, 10);
        const customerRole = await db_1.default.role.findFirst({
            where: { name: 'CUSTOMER' },
        });
        const user = await db_1.default.user.create({
            data: {
                email: validated.email,
                passwordHash,
                name: validated.name,
                phone: validated.phone || null,
                roleId: customerRole?.id || 3, // fallback to 3 (Customer)
            },
            include: {
                role: true,
            },
        });
        // Create audit log
        await db_1.default.auditLog.create({
            data: {
                userId: user.id,
                action: 'USER_REGISTER',
                details: `User registered: ${user.email}`,
            },
        });
        res.status(201).json({
            status: 'success',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role.name,
                    createdAt: user.createdAt,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const validated = loginSchema.parse(req.body);
        const user = await db_1.default.user.findUnique({
            where: { email: validated.email },
            include: { role: true },
        });
        if (!user || !(await bcryptjs_1.default.compare(validated.password, user.passwordHash))) {
            return next(new errorHandler_1.AppError('Invalid email or password', 401));
        }
        const accessToken = (0, jwt_1.signAccessToken)(user.id, user.role.name);
        const refreshToken = (0, jwt_1.signRefreshToken)(user.id);
        // Save refresh token in database
        await db_1.default.user.update({
            where: { id: user.id },
            data: { refreshToken },
        });
        // Create audit log
        await db_1.default.auditLog.create({
            data: {
                userId: user.id,
                action: 'USER_LOGIN',
                details: `User logged in: ${user.email}`,
            },
        });
        // Set refresh token in HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        res.status(200).json({
            status: 'success',
            data: {
                accessToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role.name,
                    phone: user.phone,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const refresh = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
        if (!refreshToken) {
            return next(new errorHandler_1.AppError('No refresh token provided', 401));
        }
        const decoded = (0, jwt_1.verifyRefreshToken)(refreshToken);
        const user = await db_1.default.user.findUnique({
            where: { id: decoded.userId },
            include: { role: true },
        });
        if (!user || user.refreshToken !== refreshToken) {
            return next(new errorHandler_1.AppError('Invalid or expired refresh token', 401));
        }
        const accessToken = (0, jwt_1.signAccessToken)(user.id, user.role.name);
        res.status(200).json({
            status: 'success',
            data: {
                accessToken,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.refresh = refresh;
const logout = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
        if (refreshToken) {
            const decoded = (0, jwt_1.verifyRefreshToken)(refreshToken);
            await db_1.default.user.update({
                where: { id: decoded.userId },
                data: { refreshToken: null },
            });
        }
        res.clearCookie('refreshToken');
        res.status(200).json({
            status: 'success',
            message: 'Logged out successfully',
        });
    }
    catch (error) {
        // If token verify fails in logout, just clear cookie anyway
        res.clearCookie('refreshToken');
        res.status(200).json({
            status: 'success',
            message: 'Logged out',
        });
    }
};
exports.logout = logout;
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return next(new errorHandler_1.AppError('Email is required', 400));
        }
        const user = await db_1.default.user.findUnique({ where: { email } });
        if (!user) {
            // For security, don't reveal if user doesn't exist
            return res.status(200).json({
                status: 'success',
                message: 'If the email matches an account, a reset link will be sent.',
            });
        }
        // Generate single-use reset token using password hash in signature
        const secret = (process.env.JWT_ACCESS_SECRET || 'superaccesssecretkey') + user.passwordHash;
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, secret, { expiresIn: '1h' });
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/reset-password?userId=${user.id}&token=${token}`;
        await (0, mailer_1.sendPasswordResetEmail)(user.email, user.name, resetUrl);
        res.status(200).json({
            status: 'success',
            message: 'If the email matches an account, a reset link will be sent.',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res, next) => {
    try {
        const { userId, token, newPassword } = req.body;
        if (!userId || !token || !newPassword) {
            return next(new errorHandler_1.AppError('User ID, token, and new password are required', 400));
        }
        const user = await db_1.default.user.findUnique({ where: { id: userId } });
        if (!user) {
            return next(new errorHandler_1.AppError('User not found', 404));
        }
        // Verify token with secret that includes current hash
        const secret = (process.env.JWT_ACCESS_SECRET || 'superaccesssecretkey') + user.passwordHash;
        try {
            jsonwebtoken_1.default.verify(token, secret);
        }
        catch (e) {
            return next(new errorHandler_1.AppError('Invalid or expired reset token', 400));
        }
        // Update password (hash changes, which automatically invalidates the token)
        const newPasswordHash = await bcryptjs_1.default.hash(newPassword, 10);
        await db_1.default.user.update({
            where: { id: user.id },
            data: {
                passwordHash: newPasswordHash,
                refreshToken: null, // invalidate active sessions
            },
        });
        // Create audit log
        await db_1.default.auditLog.create({
            data: {
                userId: user.id,
                action: 'PASSWORD_RESET',
                details: 'User reset password successfully',
            },
        });
        res.status(200).json({
            status: 'success',
            message: 'Password reset successful. You can now log in.',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.resetPassword = resetPassword;

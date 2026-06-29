"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserRole = exports.getUsers = void 0;
const db_1 = __importDefault(require("../config/db"));
const errorHandler_1 = require("../middlewares/errorHandler");
const getUsers = async (req, res, next) => {
    try {
        if (!req.user)
            return next(new errorHandler_1.AppError('Unauthorized', 401));
        if (req.user.role !== 'ADMIN')
            return next(new errorHandler_1.AppError('Forbidden: Admin access required', 403));
        const users = await db_1.default.user.findMany({
            include: {
                role: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        const userList = users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            role: u.role.name,
            roleId: u.roleId,
            createdAt: u.createdAt,
        }));
        res.status(200).json({
            status: 'success',
            results: userList.length,
            data: {
                users: userList,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUsers = getUsers;
const updateUserRole = async (req, res, next) => {
    try {
        if (!req.user)
            return next(new errorHandler_1.AppError('Unauthorized', 401));
        if (req.user.role !== 'ADMIN')
            return next(new errorHandler_1.AppError('Forbidden: Admin access required', 403));
        const { id } = req.params;
        const { roleId } = req.body;
        if (!roleId) {
            return next(new errorHandler_1.AppError('roleId is required', 400));
        }
        const role = await db_1.default.role.findUnique({
            where: { id: parseInt(roleId, 10) },
        });
        if (!role) {
            return next(new errorHandler_1.AppError('Invalid role ID', 400));
        }
        // Verify user exists
        const targetUser = await db_1.default.user.findUnique({ where: { id } });
        if (!targetUser) {
            return next(new errorHandler_1.AppError('User not found', 404));
        }
        // Update user role
        const updatedUser = await db_1.default.user.update({
            where: { id },
            data: { roleId: role.id },
            include: { role: true },
        });
        // Create Audit Log
        await db_1.default.auditLog.create({
            data: {
                userId: req.user.userId,
                action: 'USER_ROLE_UPDATE',
                details: `Updated role of ${updatedUser.email} to ${role.name}`,
            },
        });
        res.status(200).json({
            status: 'success',
            data: {
                user: {
                    id: updatedUser.id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    role: updatedUser.role.name,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateUserRole = updateUserRole;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getComments = exports.createComment = void 0;
const zod_1 = require("zod");
const db_1 = __importDefault(require("../config/db"));
const errorHandler_1 = require("../middlewares/errorHandler");
const createCommentSchema = zod_1.z.object({
    commentText: zod_1.z.string().min(1, { message: 'Comment text cannot be empty' }),
    isInternal: zod_1.z.preprocess((val) => val === 'true' || val === true, zod_1.z.boolean().default(false)),
});
const createComment = async (req, res, next) => {
    try {
        if (!req.user)
            return next(new errorHandler_1.AppError('Unauthorized', 401));
        const { id: returnRequestId } = req.params;
        const validated = createCommentSchema.parse(req.body);
        const returnRequest = await db_1.default.returnRequest.findUnique({
            where: { id: returnRequestId },
            include: { order: true },
        });
        if (!returnRequest) {
            return next(new errorHandler_1.AppError('Return request not found', 404));
        }
        // Customer security check
        if (req.user.role === 'CUSTOMER') {
            if (returnRequest.order.userId !== req.user.userId) {
                return next(new errorHandler_1.AppError('Access denied', 403));
            }
            // Customers cannot write internal messages
            validated.isInternal = false;
        }
        const comment = await db_1.default.comment.create({
            data: {
                returnRequestId,
                userId: req.user.userId,
                commentText: validated.commentText,
                isInternal: validated.isInternal,
            },
            include: {
                user: {
                    select: {
                        name: true,
                        role: { select: { name: true } },
                    },
                },
            },
        });
        // In-app Notification
        if (req.user.role === 'CUSTOMER') {
            // Notify assigned agent or admin
            if (returnRequest.assignedToId) {
                await db_1.default.notification.create({
                    data: {
                        userId: returnRequest.assignedToId,
                        message: `Customer added a comment on request ${returnRequestId.substring(0, 8)}.`,
                    },
                });
            }
        }
        else {
            // Notify customer (if not internal comment)
            if (!validated.isInternal) {
                await db_1.default.notification.create({
                    data: {
                        userId: returnRequest.order.userId,
                        message: `A support representative commented on your return request.`,
                    },
                });
            }
        }
        res.status(201).json({
            status: 'success',
            data: {
                comment,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createComment = createComment;
const getComments = async (req, res, next) => {
    try {
        if (!req.user)
            return next(new errorHandler_1.AppError('Unauthorized', 401));
        const { id: returnRequestId } = req.params;
        const returnRequest = await db_1.default.returnRequest.findUnique({
            where: { id: returnRequestId },
            include: { order: true },
        });
        if (!returnRequest) {
            return next(new errorHandler_1.AppError('Return request not found', 404));
        }
        // Customer check
        if (req.user.role === 'CUSTOMER' && returnRequest.order.userId !== req.user.userId) {
            return next(new errorHandler_1.AppError('Access denied', 403));
        }
        // Build filter based on role
        const whereClause = {
            returnRequestId,
        };
        if (req.user.role === 'CUSTOMER') {
            whereClause.isInternal = false;
        }
        const comments = await db_1.default.comment.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        name: true,
                        role: { select: { name: true } },
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
        res.status(200).json({
            status: 'success',
            results: comments.length,
            data: {
                comments,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getComments = getComments;

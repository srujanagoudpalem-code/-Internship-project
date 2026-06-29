"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportReturnsCSV = exports.deleteReturn = exports.updateReturn = exports.getReturnById = exports.getReturns = exports.createReturn = void 0;
const zod_1 = require("zod");
const db_1 = __importDefault(require("../config/db"));
const errorHandler_1 = require("../middlewares/errorHandler");
const uploadService_1 = require("../services/uploadService");
const mailer_1 = require("../config/mailer");
const types_1 = require("../types");
const createReturnSchema = zod_1.z.object({
    orderNumber: zod_1.z.string().min(1, { message: 'Order number is required' }),
    customerName: zod_1.z.string().min(2, { message: 'Customer name is required' }),
    email: zod_1.z.string().email({ message: 'Invalid email address' }),
    phone: zod_1.z.string().min(5, { message: 'Phone number is required' }),
    issueType: zod_1.z.nativeEnum(types_1.IssueType, { errorMap: () => ({ message: 'Invalid issue type' }) }),
    issueDescription: zod_1.z.string().min(10, { message: 'Description must be at least 10 characters' }),
    preferredResolution: zod_1.z.nativeEnum(types_1.PreferredResolution, { errorMap: () => ({ message: 'Invalid preferred resolution' }) }),
    termsAccepted: zod_1.z.preprocess((val) => val === 'true' || val === true, zod_1.z.boolean().refine((val) => val === true, {
        message: 'Terms and conditions must be accepted',
    })),
});
const createReturn = async (req, res, next) => {
    try {
        if (!req.user)
            return next(new errorHandler_1.AppError('Unauthorized', 401));
        const validated = createReturnSchema.parse(req.body);
        // Find the order by orderNumber
        const order = await db_1.default.order.findUnique({
            where: { orderNumber: validated.orderNumber },
            include: { user: true },
        });
        if (!order) {
            return next(new errorHandler_1.AppError(`Order '${validated.orderNumber}' not found.`, 404));
        }
        // Verify order belongs to this customer
        if (order.userId !== req.user.userId) {
            return next(new errorHandler_1.AppError('This order does not belong to your account.', 403));
        }
        // Check if a return request already exists for this order
        const existingRequest = await db_1.default.returnRequest.findFirst({
            where: { orderId: order.id, status: { not: 'CLOSED' } },
        });
        if (existingRequest) {
            return next(new errorHandler_1.AppError('An active return request already exists for this order.', 400));
        }
        // Create the ReturnRequest
        const returnRequest = await db_1.default.returnRequest.create({
            data: {
                orderId: order.id,
                customerName: validated.customerName,
                email: validated.email,
                phone: validated.phone,
                issueType: validated.issueType,
                issueDescription: validated.issueDescription,
                preferredResolution: validated.preferredResolution,
                status: 'PENDING',
                termsAccepted: validated.termsAccepted,
            },
        });
        // Handle image uploads
        const imageRecords = [];
        if (req.files && Array.isArray(req.files)) {
            for (const file of req.files) {
                const uploaded = await (0, uploadService_1.uploadImage)(file);
                const img = await db_1.default.returnImage.create({
                    data: {
                        returnRequestId: returnRequest.id,
                        imageUrl: uploaded.imageUrl,
                        publicId: uploaded.publicId,
                    },
                });
                imageRecords.push(img);
            }
        }
        // Create initial status history
        await db_1.default.statusHistory.create({
            data: {
                returnRequestId: returnRequest.id,
                status: 'PENDING',
                note: 'Request raised by customer.',
                createdById: req.user.userId,
            },
        });
        // Create system notification for admins
        const admins = await db_1.default.user.findMany({
            where: { role: { name: 'ADMIN' } },
        });
        for (const admin of admins) {
            await db_1.default.notification.create({
                data: {
                    userId: admin.id,
                    message: `New Return Request ${returnRequest.id.substring(0, 8)} submitted for order ${order.orderNumber}.`,
                },
            });
        }
        // Audit Log
        await db_1.default.auditLog.create({
            data: {
                userId: req.user.userId,
                action: 'RETURN_CREATE',
                details: `Created return request ${returnRequest.id} for order ${order.orderNumber}`,
            },
        });
        // Send confirmation email
        await (0, mailer_1.sendRequestSubmittedEmail)(validated.email, validated.customerName, returnRequest.id, order.orderNumber);
        res.status(201).json({
            status: 'success',
            data: {
                returnRequest: {
                    ...returnRequest,
                    images: imageRecords,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createReturn = createReturn;
const getReturns = async (req, res, next) => {
    try {
        if (!req.user)
            return next(new errorHandler_1.AppError('Unauthorized', 401));
        const { status, issueType, preferredResolution, search, sortBy = 'createdAt', sortOrder = 'desc', page = '1', limit = '10', } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        // Build filter conditions
        const whereClause = {};
        // Customer filters: only see their own requests
        if (req.user.role === 'CUSTOMER') {
            whereClause.order = {
                userId: req.user.userId,
            };
        }
        // Admin/Support filters
        if (status) {
            whereClause.status = status;
        }
        if (issueType) {
            whereClause.issueType = issueType;
        }
        if (preferredResolution) {
            whereClause.preferredResolution = preferredResolution;
        }
        if (search) {
            const searchString = search;
            whereClause.OR = [
                { customerName: { contains: searchString, mode: 'insensitive' } },
                { email: { contains: searchString, mode: 'insensitive' } },
                { phone: { contains: searchString, mode: 'insensitive' } },
                { id: { contains: searchString, mode: 'insensitive' } },
                {
                    order: {
                        orderNumber: { contains: searchString, mode: 'insensitive' },
                    },
                },
            ];
        }
        const total = await db_1.default.returnRequest.count({ where: whereClause });
        const returns = await db_1.default.returnRequest.findMany({
            where: whereClause,
            include: {
                order: true,
                assignedTo: {
                    select: { id: true, name: true, email: true },
                },
                images: true,
            },
            orderBy: {
                [sortBy]: sortOrder,
            },
            skip,
            take: limitNum,
        });
        res.status(200).json({
            status: 'success',
            results: returns.length,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
            data: {
                returns,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getReturns = getReturns;
const getReturnById = async (req, res, next) => {
    try {
        if (!req.user)
            return next(new errorHandler_1.AppError('Unauthorized', 401));
        const { id } = req.params;
        const returnRequest = await db_1.default.returnRequest.findUnique({
            where: { id },
            include: {
                order: {
                    include: {
                        orderItems: {
                            include: {
                                product: true,
                            },
                        },
                    },
                },
                assignedTo: {
                    select: { id: true, name: true, email: true, phone: true },
                },
                images: true,
                statusHistory: {
                    include: {
                        createdBy: {
                            select: { name: true, role: { select: { name: true } } },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                comments: {
                    include: {
                        user: {
                            select: { name: true, role: { select: { name: true } } },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        if (!returnRequest) {
            return next(new errorHandler_1.AppError('Return request not found', 404));
        }
        // Customer security: verify request belongs to this customer
        if (req.user.role === 'CUSTOMER' && returnRequest.order.userId !== req.user.userId) {
            return next(new errorHandler_1.AppError('Access denied', 403));
        }
        res.status(200).json({
            status: 'success',
            data: {
                returnRequest,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getReturnById = getReturnById;
const updateReturn = async (req, res, next) => {
    try {
        if (!req.user)
            return next(new errorHandler_1.AppError('Unauthorized', 401));
        if (req.user.role === 'CUSTOMER')
            return next(new errorHandler_1.AppError('Unauthorized', 403));
        const { id } = req.params;
        const { status, assignedToId, note } = req.body;
        const returnRequest = await db_1.default.returnRequest.findUnique({
            where: { id },
            include: { order: true },
        });
        if (!returnRequest) {
            return next(new errorHandler_1.AppError('Return request not found', 404));
        }
        const updateData = {};
        let statusChanged = false;
        let oldStatus = returnRequest.status;
        if (status) {
            updateData.status = status;
            if (oldStatus !== status) {
                statusChanged = true;
            }
        }
        if (assignedToId !== undefined) {
            updateData.assignedToId = assignedToId || null;
        }
        const updatedRequest = await db_1.default.returnRequest.update({
            where: { id },
            data: updateData,
            include: {
                assignedTo: { select: { name: true, email: true } },
            },
        });
        // Create status history log
        if (statusChanged || note) {
            await db_1.default.statusHistory.create({
                data: {
                    returnRequestId: id,
                    status: status || oldStatus,
                    note: note || (statusChanged ? `Status updated from ${oldStatus.replace('_', ' ')} to ${status.replace('_', ' ')}.` : ''),
                    createdById: req.user.userId,
                },
            });
            // Email notifications for status updates
            if (statusChanged) {
                // Send email to customer
                await (0, mailer_1.sendRequestStatusUpdatedEmail)(returnRequest.email, returnRequest.customerName, id, status, note);
                // Notify customer in-app
                await db_1.default.notification.create({
                    data: {
                        userId: returnRequest.order.userId,
                        message: `Your return request for order ${returnRequest.order.orderNumber} status has been updated to ${status.replace('_', ' ')}.`,
                    },
                });
            }
        }
        // Audit logs
        await db_1.default.auditLog.create({
            data: {
                userId: req.user.userId,
                action: 'RETURN_UPDATE',
                details: `Updated return request ${id}: Status=${status || oldStatus}, AssignedTo=${assignedToId || 'unchanged'}`,
            },
        });
        res.status(200).json({
            status: 'success',
            data: {
                returnRequest: updatedRequest,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateReturn = updateReturn;
const deleteReturn = async (req, res, next) => {
    try {
        if (!req.user)
            return next(new errorHandler_1.AppError('Unauthorized', 401));
        const { id } = req.params;
        const returnRequest = await db_1.default.returnRequest.findUnique({
            where: { id },
            include: {
                order: true,
                images: true,
            },
        });
        if (!returnRequest) {
            return next(new errorHandler_1.AppError('Return request not found', 404));
        }
        // Only creator customer can delete/cancel a request, and only when PENDING
        if (req.user.role === 'CUSTOMER') {
            if (returnRequest.order.userId !== req.user.userId) {
                return next(new errorHandler_1.AppError('Access denied', 403));
            }
            if (returnRequest.status !== 'PENDING') {
                return next(new errorHandler_1.AppError('You can only cancel return requests that are PENDING', 400));
            }
        }
        else if (req.user.role !== 'ADMIN') {
            return next(new errorHandler_1.AppError('Only the customer or an admin can delete requests', 403));
        }
        // Clean up local or cloud images before deleting request record
        for (const img of returnRequest.images) {
            if (img.publicId) {
                await (0, uploadService_1.deleteImage)(img.publicId);
            }
        }
        await db_1.default.returnRequest.delete({
            where: { id },
        });
        // Audit logs
        await db_1.default.auditLog.create({
            data: {
                userId: req.user.userId,
                action: 'RETURN_DELETE',
                details: `Cancelled/Deleted return request ${id} for order ${returnRequest.order.orderNumber}`,
            },
        });
        res.status(200).json({
            status: 'success',
            message: 'Return request has been deleted/cancelled successfully.',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteReturn = deleteReturn;
const exportReturnsCSV = async (req, res, next) => {
    try {
        if (!req.user)
            return next(new errorHandler_1.AppError('Unauthorized', 401));
        if (req.user.role === 'CUSTOMER')
            return next(new errorHandler_1.AppError('Forbidden', 403));
        const returns = await db_1.default.returnRequest.findMany({
            include: {
                order: true,
                assignedTo: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        const csvHeaders = 'Request ID,Order Number,Customer Name,Email,Phone,Issue Type,Resolution,Status,Assigned To,Date Created\n';
        const csvRows = returns.map((r) => {
            const escape = (str) => `"${(str || '').replace(/"/g, '""')}"`;
            return [
                escape(r.id),
                escape(r.order.orderNumber),
                escape(r.customerName),
                escape(r.email),
                escape(r.phone),
                escape(r.issueType),
                escape(r.preferredResolution),
                escape(r.status),
                escape(r.assignedTo?.name || 'Unassigned'),
                escape(r.createdAt.toISOString()),
            ].join(',');
        }).join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=returns_export.csv');
        res.status(200).send(csvHeaders + csvRows);
    }
    catch (error) {
        next(error);
    }
};
exports.exportReturnsCSV = exportReturnsCSV;

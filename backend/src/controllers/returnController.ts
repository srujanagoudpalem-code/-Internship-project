import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middlewares/errorHandler';
import { uploadImage, deleteImage } from '../services/uploadService';
import { sendRequestSubmittedEmail, sendRequestStatusUpdatedEmail } from '../config/mailer';
import { IssueType, PreferredResolution, RequestStatus } from '../types';


const createReturnSchema = z.object({
  orderNumber: z.string().min(1, { message: 'Order number is required' }),
  customerName: z.string().min(2, { message: 'Customer name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  phone: z.string().min(5, { message: 'Phone number is required' }),
  issueType: z.nativeEnum(IssueType, { errorMap: () => ({ message: 'Invalid issue type' }) }),
  issueDescription: z.string().min(10, { message: 'Description must be at least 10 characters' }),
  preferredResolution: z.nativeEnum(PreferredResolution, { errorMap: () => ({ message: 'Invalid preferred resolution' }) }),
  termsAccepted: z.preprocess((val) => val === 'true' || val === true, z.boolean().refine((val) => val === true, {
    message: 'Terms and conditions must be accepted',
  })),
});

export const createReturn = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return next(new AppError('Unauthorized', 401));

    const validated = createReturnSchema.parse(req.body);

    // Find the order by orderNumber
    const order = await prisma.order.findUnique({
      where: { orderNumber: validated.orderNumber },
      include: { user: true },
    });

    if (!order) {
      return next(new AppError(`Order '${validated.orderNumber}' not found.`, 404));
    }

    // Verify order belongs to this customer
    if (order.userId !== req.user.userId) {
      return next(new AppError('This order does not belong to your account.', 403));
    }

    // Check if a return request already exists for this order
    const existingRequest = await prisma.returnRequest.findFirst({
      where: { orderId: order.id, status: { not: 'CLOSED' } },
    });
    
    if (existingRequest) {
      return next(new AppError('An active return request already exists for this order.', 400));
    }

    // Create the ReturnRequest
    const returnRequest = await prisma.returnRequest.create({
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
        const uploaded = await uploadImage(file);
        const img = await prisma.returnImage.create({
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
    await prisma.statusHistory.create({
      data: {
        returnRequestId: returnRequest.id,
        status: 'PENDING',
        note: 'Request raised by customer.',
        createdById: req.user.userId,
      },
    });

    // Create system notification for admins
    const admins = await prisma.user.findMany({
      where: { role: { name: 'ADMIN' } },
    });
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          message: `New Return Request ${returnRequest.id.substring(0, 8)} submitted for order ${order.orderNumber}.`,
        },
      });
    }

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'RETURN_CREATE',
        details: `Created return request ${returnRequest.id} for order ${order.orderNumber}`,
      },
    });

    // Send confirmation email
    await sendRequestSubmittedEmail(validated.email, validated.customerName, returnRequest.id, order.orderNumber);

    res.status(201).json({
      status: 'success',
      data: {
        returnRequest: {
          ...returnRequest,
          images: imageRecords,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getReturns = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return next(new AppError('Unauthorized', 401));

    const {
      status,
      issueType,
      preferredResolution,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = '1',
      limit = '10',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter conditions
    const whereClause: any = {};

    // Customer filters: only see their own requests
    if (req.user.role === 'CUSTOMER') {
      whereClause.order = {
        userId: req.user.userId,
      };
    }

    // Admin/Support filters
    if (status) {
      whereClause.status = status as RequestStatus;
    }
    if (issueType) {
      whereClause.issueType = issueType as IssueType;
    }
    if (preferredResolution) {
      whereClause.preferredResolution = preferredResolution as PreferredResolution;
    }

    if (search) {
      const searchString = search as string;
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

    const total = await prisma.returnRequest.count({ where: whereClause });

    const returns = await prisma.returnRequest.findMany({
      where: whereClause,
      include: {
        order: true,
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        images: true,
      },
      orderBy: {
        [sortBy as string]: sortOrder as 'asc' | 'desc',
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
  } catch (error) {
    next(error);
  }
};

export const getReturnById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return next(new AppError('Unauthorized', 401));

    const { id } = req.params;

    const returnRequest = await prisma.returnRequest.findUnique({
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
      return next(new AppError('Return request not found', 404));
    }

    // Customer security: verify request belongs to this customer
    if (req.user.role === 'CUSTOMER' && returnRequest.order.userId !== req.user.userId) {
      return next(new AppError('Access denied', 403));
    }

    res.status(200).json({
      status: 'success',
      data: {
        returnRequest,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateReturn = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return next(new AppError('Unauthorized', 401));
    if (req.user.role === 'CUSTOMER') return next(new AppError('Unauthorized', 403));

    const { id } = req.params;
    const { status, assignedToId, note } = req.body;

    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!returnRequest) {
      return next(new AppError('Return request not found', 404));
    }

    const updateData: any = {};
    let statusChanged = false;
    let oldStatus = returnRequest.status;

    if (status) {
      updateData.status = status as RequestStatus;
      if (oldStatus !== status) {
        statusChanged = true;
      }
    }

    if (assignedToId !== undefined) {
      updateData.assignedToId = assignedToId || null;
    }

    const updatedRequest = await prisma.returnRequest.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: { select: { name: true, email: true } },
      },
    });

    // Create status history log
    if (statusChanged || note) {
      await prisma.statusHistory.create({
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
        await sendRequestStatusUpdatedEmail(returnRequest.email, returnRequest.customerName, id, status, note);
        
        // Notify customer in-app
        await prisma.notification.create({
          data: {
            userId: returnRequest.order.userId,
            message: `Your return request for order ${returnRequest.order.orderNumber} status has been updated to ${status.replace('_', ' ')}.`,
          },
        });
      }
    }

    // Audit logs
    await prisma.auditLog.create({
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
  } catch (error) {
    next(error);
  }
};

export const deleteReturn = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return next(new AppError('Unauthorized', 401));

    const { id } = req.params;

    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id },
      include: {
        order: true,
        images: true,
      },
    });

    if (!returnRequest) {
      return next(new AppError('Return request not found', 404));
    }

    // Only creator customer can delete/cancel a request, and only when PENDING
    if (req.user.role === 'CUSTOMER') {
      if (returnRequest.order.userId !== req.user.userId) {
        return next(new AppError('Access denied', 403));
      }
      if (returnRequest.status !== 'PENDING') {
        return next(new AppError('You can only cancel return requests that are PENDING', 400));
      }
    } else if (req.user.role !== 'ADMIN') {
      return next(new AppError('Only the customer or an admin can delete requests', 403));
    }

    // Clean up local or cloud images before deleting request record
    for (const img of returnRequest.images) {
      if (img.publicId) {
        await deleteImage(img.publicId);
      }
    }

    await prisma.returnRequest.delete({
      where: { id },
    });

    // Audit logs
    await prisma.auditLog.create({
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
  } catch (error) {
    next(error);
  }
};

export const exportReturnsCSV = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return next(new AppError('Unauthorized', 401));
    if (req.user.role === 'CUSTOMER') return next(new AppError('Forbidden', 403));

    const returns = await prisma.returnRequest.findMany({
      include: {
        order: true,
        assignedTo: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const csvHeaders = 'Request ID,Order Number,Customer Name,Email,Phone,Issue Type,Resolution,Status,Assigned To,Date Created\n';
    
    const csvRows = returns.map((r) => {
      const escape = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
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
  } catch (error) {
    next(error);
  }
};


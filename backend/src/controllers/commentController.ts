import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middlewares/errorHandler';

const createCommentSchema = z.object({
  commentText: z.string().min(1, { message: 'Comment text cannot be empty' }),
  isInternal: z.preprocess((val) => val === 'true' || val === true, z.boolean().default(false)),
});

export const createComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return next(new AppError('Unauthorized', 401));

    const { id: returnRequestId } = req.params;
    const validated = createCommentSchema.parse(req.body);

    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: returnRequestId },
      include: { order: true },
    });

    if (!returnRequest) {
      return next(new AppError('Return request not found', 404));
    }

    // Customer security check
    if (req.user.role === 'CUSTOMER') {
      if (returnRequest.order.userId !== req.user.userId) {
        return next(new AppError('Access denied', 403));
      }
      // Customers cannot write internal messages
      validated.isInternal = false;
    }

    const comment = await prisma.comment.create({
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
        await prisma.notification.create({
          data: {
            userId: returnRequest.assignedToId,
            message: `Customer added a comment on request ${returnRequestId.substring(0, 8)}.`,
          },
        });
      }
    } else {
      // Notify customer (if not internal comment)
      if (!validated.isInternal) {
        await prisma.notification.create({
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
  } catch (error) {
    next(error);
  }
};

export const getComments = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return next(new AppError('Unauthorized', 401));

    const { id: returnRequestId } = req.params;

    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: returnRequestId },
      include: { order: true },
    });

    if (!returnRequest) {
      return next(new AppError('Return request not found', 404));
    }

    // Customer check
    if (req.user.role === 'CUSTOMER' && returnRequest.order.userId !== req.user.userId) {
      return next(new AppError('Access denied', 403));
    }

    // Build filter based on role
    const whereClause: any = {
      returnRequestId,
    };

    if (req.user.role === 'CUSTOMER') {
      whereClause.isInternal = false;
    }

    const comments = await prisma.comment.findMany({
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
  } catch (error) {
    next(error);
  }
};

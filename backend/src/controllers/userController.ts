import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middlewares/errorHandler';

export const getUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return next(new AppError('Unauthorized', 401));
    if (req.user.role !== 'ADMIN') return next(new AppError('Forbidden: Admin access required', 403));

    const users = await prisma.user.findMany({
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
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return next(new AppError('Unauthorized', 401));
    if (req.user.role !== 'ADMIN') return next(new AppError('Forbidden: Admin access required', 403));

    const { id } = req.params;
    const { roleId } = req.body;

    if (!roleId) {
      return next(new AppError('roleId is required', 400));
    }

    const role = await prisma.role.findUnique({
      where: { id: parseInt(roleId, 10) },
    });

    if (!role) {
      return next(new AppError('Invalid role ID', 400));
    }

    // Verify user exists
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return next(new AppError('User not found', 404));
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { roleId: role.id },
      include: { role: true },
    });

    // Create Audit Log
    await prisma.auditLog.create({
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
  } catch (error) {
    next(error);
  }
};

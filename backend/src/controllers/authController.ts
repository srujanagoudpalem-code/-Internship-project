import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../config/db';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../config/jwt';
import { AppError } from '../middlewares/errorHandler';
import { sendPasswordResetEmail } from '../config/mailer';

const registerSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  phone: z.string().optional().nullable(),
});

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return next(new AppError('Email already in use', 409));
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);

    const customerRole = await prisma.role.findFirst({
      where: { name: 'CUSTOMER' },
    });

    const user = await prisma.user.create({
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
    await prisma.auditLog.create({
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
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validated.email },
      include: { role: true },
    });

    if (!user || !(await bcrypt.compare(validated.password, user.passwordHash))) {
      return next(new AppError('Invalid email or password', 401));
    }

    const accessToken = signAccessToken(user.id, user.role.name);
    const refreshToken = signRefreshToken(user.id);

    // Save refresh token in database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    // Create audit log
    await prisma.auditLog.create({
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
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return next(new AppError('No refresh token provided', 401));
    }

    const decoded = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true },
    });

    if (!user || user.refreshToken !== refreshToken) {
      return next(new AppError('Invalid or expired refresh token', 401));
    }

    const accessToken = signAccessToken(user.id, user.role.name);

    res.status(200).json({
      status: 'success',
      data: {
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (refreshToken) {
      const decoded = verifyRefreshToken(refreshToken);
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { refreshToken: null },
      });
    }

    res.clearCookie('refreshToken');

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (error) {
    // If token verify fails in logout, just clear cookie anyway
    res.clearCookie('refreshToken');
    res.status(200).json({
      status: 'success',
      message: 'Logged out',
    });
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) {
      return next(new AppError('Email is required', 400));
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // For security, don't reveal if user doesn't exist
      return res.status(200).json({
        status: 'success',
        message: 'If the email matches an account, a reset link will be sent.',
      });
    }

    // Generate single-use reset token using password hash in signature
    const secret = (process.env.JWT_ACCESS_SECRET || 'superaccesssecretkey') + user.passwordHash;
    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '1h' });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?userId=${user.id}&token=${token}`;

    await sendPasswordResetEmail(user.email, user.name, resetUrl);

    res.status(200).json({
      status: 'success',
      message: 'If the email matches an account, a reset link will be sent.',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, token, newPassword } = req.body;
    if (!userId || !token || !newPassword) {
      return next(new AppError('User ID, token, and new password are required', 400));
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Verify token with secret that includes current hash
    const secret = (process.env.JWT_ACCESS_SECRET || 'superaccesssecretkey') + user.passwordHash;
    
    try {
      jwt.verify(token, secret);
    } catch (e) {
      return next(new AppError('Invalid or expired reset token', 400));
    }

    // Update password (hash changes, which automatically invalidates the token)
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        refreshToken: null, // invalidate active sessions
      },
    });

    // Create audit log
    await prisma.auditLog.create({
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
  } catch (error) {
    next(error);
  }
};

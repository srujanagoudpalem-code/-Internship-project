import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middlewares/errorHandler';

const createProductSchema = z.object({
  sku: z.string().min(3, { message: 'SKU must be at least 3 characters' }),
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  description: z.string().optional().nullable(),
  price: z.preprocess((val) => parseFloat(val as string), z.number().positive({ message: 'Price must be a positive number' })),
  imageUrl: z.string().optional().nullable(),
});

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' },
    });

    res.status(200).json({
      status: 'success',
      results: products.length,
      data: {
        products,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return next(new AppError('Unauthorized', 401));
    if (req.user.role !== 'ADMIN') return next(new AppError('Forbidden: Admin access required', 403));

    const validated = createProductSchema.parse(req.body);

    const existingProduct = await prisma.product.findUnique({
      where: { sku: validated.sku },
    });

    if (existingProduct) {
      return next(new AppError(`Product with SKU '${validated.sku}' already exists`, 409));
    }

    const product = await prisma.product.create({
      data: {
        sku: validated.sku,
        name: validated.name,
        description: validated.description || null,
        price: validated.price,
        imageUrl: validated.imageUrl || null,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'PRODUCT_CREATE',
        details: `Created product: SKU=${product.sku}, Name=${product.name}`,
      },
    });

    res.status(201).json({
      status: 'success',
      data: {
        product,
      },
    });
  } catch (error) {
    next(error);
  }
};

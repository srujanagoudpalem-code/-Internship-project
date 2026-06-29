"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProduct = exports.getProducts = void 0;
const zod_1 = require("zod");
const db_1 = __importDefault(require("../config/db"));
const errorHandler_1 = require("../middlewares/errorHandler");
const createProductSchema = zod_1.z.object({
    sku: zod_1.z.string().min(3, { message: 'SKU must be at least 3 characters' }),
    name: zod_1.z.string().min(2, { message: 'Name must be at least 2 characters' }),
    description: zod_1.z.string().optional().nullable(),
    price: zod_1.z.preprocess((val) => parseFloat(val), zod_1.z.number().positive({ message: 'Price must be a positive number' })),
    imageUrl: zod_1.z.string().optional().nullable(),
});
const getProducts = async (req, res, next) => {
    try {
        const products = await db_1.default.product.findMany({
            orderBy: { name: 'asc' },
        });
        res.status(200).json({
            status: 'success',
            results: products.length,
            data: {
                products,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getProducts = getProducts;
const createProduct = async (req, res, next) => {
    try {
        if (!req.user)
            return next(new errorHandler_1.AppError('Unauthorized', 401));
        if (req.user.role !== 'ADMIN')
            return next(new errorHandler_1.AppError('Forbidden: Admin access required', 403));
        const validated = createProductSchema.parse(req.body);
        const existingProduct = await db_1.default.product.findUnique({
            where: { sku: validated.sku },
        });
        if (existingProduct) {
            return next(new errorHandler_1.AppError(`Product with SKU '${validated.sku}' already exists`, 409));
        }
        const product = await db_1.default.product.create({
            data: {
                sku: validated.sku,
                name: validated.name,
                description: validated.description || null,
                price: validated.price,
                imageUrl: validated.imageUrl || null,
            },
        });
        // Create Audit Log
        await db_1.default.auditLog.create({
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
    }
    catch (error) {
        next(error);
    }
};
exports.createProduct = createProduct;

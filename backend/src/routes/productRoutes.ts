import { Router } from 'express';
import { getProducts, createProduct } from '../controllers/productController';
import { protect, restrictTo } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', getProducts);
router.post('/', protect, restrictTo('ADMIN'), createProduct);

export default router;

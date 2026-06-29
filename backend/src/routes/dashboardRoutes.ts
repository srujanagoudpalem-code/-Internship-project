import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController';
import { protect, restrictTo } from '../middlewares/authMiddleware';

const router = Router();

router.get('/stats', protect, restrictTo('ADMIN', 'SUPPORT_EXECUTIVE'), getDashboardStats);

export default router;

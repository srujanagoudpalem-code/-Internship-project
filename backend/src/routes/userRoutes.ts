import { Router } from 'express';
import { getUsers, updateUserRole } from '../controllers/userController';
import { protect, restrictTo } from '../middlewares/authMiddleware';

const router = Router();

router.use(protect);
router.use(restrictTo('ADMIN'));

router.get('/', getUsers);
router.put('/:id/role', updateUserRole);

export default router;

import { Router } from 'express';
import {
  createReturn,
  getReturns,
  getReturnById,
  updateReturn,
  deleteReturn,
  exportReturnsCSV,
} from '../controllers/returnController';
import { createComment, getComments } from '../controllers/commentController';
import { protect, restrictTo } from '../middlewares/authMiddleware';
import { uploadImages } from '../middlewares/uploadMiddleware';

const router = Router();

// Apply protect middleware to all return routes
router.use(protect);

router.post('/', uploadImages, createReturn);
router.get('/', getReturns);
router.get('/export/csv', restrictTo('ADMIN', 'SUPPORT_EXECUTIVE'), exportReturnsCSV);
router.get('/:id', getReturnById);
router.put('/:id', restrictTo('ADMIN', 'SUPPORT_EXECUTIVE'), updateReturn);
router.delete('/:id', deleteReturn);

// Comment routes
router.post('/:id/comments', createComment);
router.get('/:id/comments', getComments);

export default router;

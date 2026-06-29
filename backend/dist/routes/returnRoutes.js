"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const returnController_1 = require("../controllers/returnController");
const commentController_1 = require("../controllers/commentController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const uploadMiddleware_1 = require("../middlewares/uploadMiddleware");
const router = (0, express_1.Router)();
// Apply protect middleware to all return routes
router.use(authMiddleware_1.protect);
router.post('/', uploadMiddleware_1.uploadImages, returnController_1.createReturn);
router.get('/', returnController_1.getReturns);
router.get('/export/csv', (0, authMiddleware_1.restrictTo)('ADMIN', 'SUPPORT_EXECUTIVE'), returnController_1.exportReturnsCSV);
router.get('/:id', returnController_1.getReturnById);
router.put('/:id', (0, authMiddleware_1.restrictTo)('ADMIN', 'SUPPORT_EXECUTIVE'), returnController_1.updateReturn);
router.delete('/:id', returnController_1.deleteReturn);
// Comment routes
router.post('/:id/comments', commentController_1.createComment);
router.get('/:id/comments', commentController_1.getComments);
exports.default = router;

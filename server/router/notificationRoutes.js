import express from 'express';
import { getNotifications, markNotificationAsRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Routes
router.get('/', getNotifications);
router.put('/:id/read', markNotificationAsRead);

export default router; 
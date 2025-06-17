import express from 'express';
import {
  getReminders,
  createReminder,
  sendBirthdayMessage,
  markReminderComplete,
  deleteReminder,
  sendReminderMessage
} from '../controllers/reminderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getReminders)
  .post(createReminder);

router.route('/birthday/message')
  .post(sendBirthdayMessage);

router.route('/:id/complete')
  .put(markReminderComplete);

router.route('/:id/send-message')
  .post(sendReminderMessage);

router.route('/:id')
  .delete(deleteReminder);

export default router; 
import express from "express";
import {
  getReminders,
  createReminder,
  markReminderComplete,
  deleteReminder,
  getDueReminders,
  sendReminderMessage
} from "../controllers/reminderController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);

router.route("/")
  .get(getReminders)
  .post(createReminder);

router.route("/:id/complete")
  .patch(markReminderComplete);

router.route("/:id/send-message")
  .post(sendReminderMessage);

router.route("/due")
  .get(getDueReminders);

router.route("/:id")
  .delete(deleteReminder);

export default router; 
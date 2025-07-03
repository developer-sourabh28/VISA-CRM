import express from "express";
import {
  getReminders,
  createReminder,
  markReminderComplete,
  deleteReminder,
  getDueReminders,
  sendReminderMessage,
  getRemindersForEnquiry
} from "../controllers/reminderController.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

router.use(isAuthenticated);

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

router.get('/enquiry/:enquiryId', getRemindersForEnquiry);

export default router; 
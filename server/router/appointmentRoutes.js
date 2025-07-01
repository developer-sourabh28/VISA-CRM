import express from 'express';
import {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getClientAppointments,
  getUpcomingAppointments
} from '../controllers/appointmentController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(isAuthenticated);

// Special routes first (before /:id routes)
router.get('/upcoming', getUpcomingAppointments);
router.get('/client/:clientId', getClientAppointments);

// Main appointment routes
router.route('/')
  .get(getAppointments)
  .post(createAppointment);

router.route('/:id')
  .get(getAppointment)
  .put(updateAppointment)
  .delete(deleteAppointment);

export default router; 
import express from 'express';
import { 
  getAppointments, 
  getUpcomingAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getClientAppointments
} from '../controllers/appointmentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Get all appointments
router.get('/', getAppointments);

// Get upcoming appointments
router.get('/upcoming', getUpcomingAppointments);

// Get single appointment
router.get('/:id', getAppointment);

// Create appointment
router.post('/', createAppointment);

// Update appointment
router.put('/:id', updateAppointment);

// Delete appointment
router.delete('/:id', deleteAppointment);

// Get appointments by client
router.get('/client/:clientId', getClientAppointments);

export default router; 
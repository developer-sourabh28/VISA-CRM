import express from 'express';
import * as clientController from '../controllers/clientController.js';
import * as clientTaskController from '../controllers/clientTaskController.js';
import * as clientMeetingController from '../controllers/clientMeetingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Utility routes - Must come before other routes to avoid path conflicts
router.get('/check-email', clientController.checkEmailExists);
router.post('/fix-duplicate-conversion', clientController.fixDuplicateConversion);

// Convert enquiry to client - This must come before the :id routes
router.post('/convert', clientController.convertEnquiryToClient);

// Get distinct visa countries for filters
router.get('/visa-countries', clientController.getDistinctVisaCountries);

// Get all clients
router.get('/', clientController.getClients);

// Get single client
router.get('/:id', clientController.getClient);

// Create new client
router.post('/', clientController.createClient);

// Update client
router.put('/:id', clientController.updateClient);

// Delete client
router.delete('/:id', clientController.deleteClient);

// Client-related data routes
router.get('/:id/payments', clientController.getClientPayments);
router.get('/:id/agreements', clientController.getClientAgreements);
router.get('/:id/appointments', clientController.getClientAppointments);

// Client Meeting routes
router.get('/:clientId/meeting', clientMeetingController.getClientMeeting);
router.post('/:clientId/meeting', clientMeetingController.createOrUpdateClientMeeting);

// Client Task routes
router.get('/:clientId/tasks', clientTaskController.getClientTasks);
router.post('/:clientId/tasks', clientTaskController.createClientTask);
router.put('/:clientId/tasks/:taskId', clientTaskController.updateClientTask);
router.delete('/:clientId/tasks/:taskId', clientTaskController.deleteClientTask);

export default router;

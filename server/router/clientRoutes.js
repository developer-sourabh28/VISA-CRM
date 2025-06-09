import express from 'express';
import * as clientController from '../controllers/clientController.js';
import * as clientTaskController from '../controllers/clientTaskController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Convert enquiry to client - This must come before the :id routes
router.post('/convert', clientController.convertEnquiryToClient);

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

// Client Task routes
router.get('/:clientId/tasks', clientTaskController.getClientTasks);
router.post('/:clientId/tasks', clientTaskController.createClientTask);
router.put('/:clientId/tasks/:taskId', clientTaskController.updateClientTask);
router.delete('/:clientId/tasks/:taskId', clientTaskController.deleteClientTask);

export default router;

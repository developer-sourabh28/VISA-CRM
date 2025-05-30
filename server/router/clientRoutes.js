import express from 'express';
import * as clientController from '../controllers/clientController.js';
// import { protect } from '../middleware/authMiddleware.js'; // uncomment if auth is implemented

const router = express.Router();

// Protect all routes if you have auth middleware
// router.use(protect);

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

export default router;

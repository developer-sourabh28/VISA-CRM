import express from 'express';
import * as clientController from '../controllers/clientController.js';
// import { protect } from '../middleware/authMiddleware.js'; // uncomment if auth is implemented

const router = express.Router();

// Protect all routes if you have auth middleware
// router.use(protect);

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

//conert client
router.post('/convert', clientController.convertEnquiryToClient);
export default router;

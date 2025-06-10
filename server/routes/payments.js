import express from 'express';
import { getClientPayments, getAllPayments, createPayment, generateInvoice } from '../controllers/paymentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all payments (filtered by user role)
router.get('/', getAllPayments);

// Get all payments for a specific client (filtered by user role)
router.get('/client/:clientId', getClientPayments);

// Create a new payment
router.post('/', createPayment);

// Generate invoice for a payment
router.get('/:paymentId/invoice', generateInvoice);

export default router; 
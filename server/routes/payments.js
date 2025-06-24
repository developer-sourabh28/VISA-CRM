import express from 'express';
import { getClientPayments, getAllPayments, createPayment, generateInvoice, getPendingPayments, generateCustomInvoice } from '../controllers/paymentController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// Get all payments (filtered by user role)
router.get('/', getAllPayments);

// Get pending payments and installments
router.get('/pending', getPendingPayments);

// Get all payments for a specific client (filtered by user role)
router.get('/client/:clientId', getClientPayments);

// Create a new payment
router.post('/', createPayment);

// Generate invoice for a payment
router.get('/invoice/:paymentId', generateInvoice);

// Generate custom invoice for a payment
router.post('/invoice/:paymentId/custom', generateCustomInvoice);

export default router; 
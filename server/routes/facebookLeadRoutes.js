import express from 'express';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';
import facebookLeadController from '../controllers/facebookLeadController.js';

const router = express.Router();

// Protect all routes with authentication
router.use(isAuthenticated);

// Manual sync endpoint (admin only)
router.get('/sync', isAdmin, facebookLeadController.handleManualSync.bind(facebookLeadController));

// Get all Facebook leads
router.get('/', facebookLeadController.getLeads.bind(facebookLeadController));

// Get a specific Facebook lead by ID
router.get('/:id', facebookLeadController.getLead.bind(facebookLeadController));

// Update lead status
router.patch('/:leadId/status', facebookLeadController.updateLeadStatus.bind(facebookLeadController));

export default router; 
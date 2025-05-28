import express from 'express';
import multer from 'multer';
import {
  createVisaTracker,
  getVisaTracker,
  getAllVisaTrackers,
  updateAgreement,
  updateMeeting,
  updateDocumentCollection,
  updateVisaApplication,
  updateSupportingDocuments,
  updatePayment,
  updateAppointment,
  updateVisaOutcome,
  getBranchVisaTrackers
} from '../controllers/visaTrackerController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Create a new visa tracker
router.post('/', authenticateToken, createVisaTracker);

// Get all visa trackers
router.get('/', authenticateToken, getAllVisaTrackers);

// Get visa tracker by client ID
router.get('/client/:clientId', authenticateToken, getVisaTracker);

// Get all visa trackers for a branch
router.get('/branch/:branchId', authenticateToken, getBranchVisaTrackers);

// Update agreement details
router.put('/agreement/:clientId', authenticateToken, upload.single('document'), updateAgreement);

// Update meeting details
router.put('/meeting/:clientId', authenticateToken, updateMeeting);

// Update document collection
router.put('/documents/:clientId', authenticateToken, upload.array('documents'), updateDocumentCollection);

// Update visa application
router.put('/application/:clientId', authenticateToken, upload.single('formFile'), updateVisaApplication);

// Update supporting documents
router.put('/supporting-documents/:clientId', authenticateToken, upload.array('documents'), updateSupportingDocuments);

// Update payment details
router.put('/payment/:clientId', authenticateToken, updatePayment);

// Update embassy appointment
router.put('/appointment/:clientId', authenticateToken, updateAppointment);

// Update visa outcome
router.put('/outcome/:clientId', authenticateToken, updateVisaOutcome);

export default router; 
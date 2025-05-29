import express from 'express';
import multer from 'multer';
import {
  createVisaTracker,
  getVisaTracker,
  getAllVisaTrackers,
  updateMeeting,
  updateDocumentCollection,
  updateVisaApplication,
  updateSupportingDocuments,
  updatePayment,
  updateAppointment,
  updateVisaOutcome,
  getBranchVisaTrackers,
  getAppointment
} from '../controllers/visaTrackerController.js';
import { createOrUpdateAgreement, getAgreement } from '../controllers/visaTracker/visaAgreementController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});

// Create a new visa tracker
router.post('/', authenticateToken, createVisaTracker);
router.get('/:clientId', authenticateToken, getVisaTracker);
router.get('/', authenticateToken, getAllVisaTrackers);
router.get('/branch/:branchId', authenticateToken, getBranchVisaTrackers);

// Agreement routes
router.post('/agreement/:clientId', authenticateToken, upload.single('document'), createOrUpdateAgreement);
router.get('/agreement/:clientId', authenticateToken, getAgreement);

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
router.get('/appointment/:clientId', authenticateToken, getAppointment);

// Update visa outcome
router.put('/outcome/:clientId', authenticateToken, updateVisaOutcome);

export default router; 
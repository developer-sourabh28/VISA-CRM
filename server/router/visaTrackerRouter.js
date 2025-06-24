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
  getAppointment,
  getPayment,
  createPayment,
  createVisaApplication
} from '../controllers/visaTrackerController.js';
import { createOrUpdateAgreement, getAgreement } from '../controllers/visaTracker/visaAgreementController.js';
import { isAuthenticated } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Create a new visa tracker
router.post('/', isAuthenticated, createVisaTracker);
router.get('/:clientId', isAuthenticated, getVisaTracker);
router.get('/', isAuthenticated, getAllVisaTrackers);
router.get('/branch/:branchId', isAuthenticated, getBranchVisaTrackers);

// Agreement routes
router.post('/agreement/:clientId', isAuthenticated, upload.single('document'), createOrUpdateAgreement);
router.get('/agreement/:clientId', isAuthenticated, getAgreement);

// Update meeting details
router.put('/meeting/:clientId', isAuthenticated, updateMeeting);

// Update document collection
router.put('/documents/:clientId', isAuthenticated, upload.array('documents'), updateDocumentCollection);

// Update visa application
router.post('/application/:clientId', upload.single('formFile'), isAuthenticated, createVisaApplication);

// Update supporting documents
router.put('/supporting-documents/:clientId', isAuthenticated, upload.array('documents'), updateSupportingDocuments);

// Update payment details
router.put('/payment/:clientId', isAuthenticated, updatePayment);

// Update embassy appointment
router.put('/appointment/:clientId', isAuthenticated, updateAppointment);
router.get('/appointment/:clientId', isAuthenticated, getAppointment);

// Update visa outcome
router.put('/outcome/:clientId', isAuthenticated, updateVisaOutcome);

// Payment routes
router.post('/payment/:clientId', isAuthenticated, createPayment);
router.get('/payment/:clientId', isAuthenticated, getPayment);

export default router; 
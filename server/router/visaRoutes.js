import express from "express";

import {
  createVisaTracker,
  getVisaTracker,
  getAllVisaTrackers,
  getBranchVisaTrackers,
  
  // Agreement endpoints
  // createAgreement,
  
  // Meeting endpoints
  createMeeting,
  getMeeting,
  
  // Document Collection endpoints
  createDocumentCollection,
  getDocumentCollection,
  
  // Visa Application endpoints
  createVisaApplication,
  getVisaApplication,
  
  // Supporting Documents endpoints
  createSupportingDocuments,
  getSupportingDocuments,
  
  // Payment endpoints
  createPayment,
  getPayment,
  
  // Appointment endpoints
  createAppointment,
  getAppointment,
  
  // Visa Outcome endpoints
  createVisaOutcome,
  getVisaOutcome,
  
  // Legacy update methods (for backward compatibility)
  updateMeeting,
  updateDocumentCollection,
  updateVisaApplication,
  updateSupportingDocuments,
  updatePayment,
  updateAppointment,
  updateVisaOutcome
} from "../controllers/visaTrackerController.js";

import upload from "../middleware/upload.js";

const router = express.Router();

// ============= MAIN TRACKER ROUTES =============
router.post('/visa-tracker', createVisaTracker);
router.get('/visa-tracker/:clientId', getVisaTracker);
router.get('/visa-trackers', getAllVisaTrackers);
router.get('/visa-trackers/branch/:branchId', getBranchVisaTrackers);

// ============= AGREEMENT ROUTES =============
// router.post('/visa-tracker/:clientId/agreement', upload.single('document'), createAgreement);
// router.get('/visa-tracker/:clientId/agreement', getAgreement);

// ============= MEETING ROUTES =============
router.post('/visa-tracker/:clientId/meeting', createMeeting);
router.get('/visa-tracker/:clientId/meeting', getMeeting);

// ============= DOCUMENT COLLECTION ROUTES =============
router.post('/visa-tracker/:clientId/documents', upload.array('documents'), createDocumentCollection);
router.get('/visa-tracker/:clientId/documents', getDocumentCollection);

// ============= VISA APPLICATION ROUTES =============
router.post('/visa-tracker/:clientId/application', upload.single('formFile'), createVisaApplication);
router.get('/visa-tracker/:clientId/application', getVisaApplication);

// ============= SUPPORTING DOCUMENTS ROUTES =============
router.post('/visa-tracker/:clientId/supporting-docs', upload.array('documents'), createSupportingDocuments);
router.get('/visa-tracker/:clientId/supporting-docs', getSupportingDocuments);

// ============= PAYMENT ROUTES =============
router.post('/visa-tracker/:clientId/payment', createPayment);
router.get('/visa-tracker/:clientId/payment', getPayment);

// ============= APPOINTMENT ROUTES =============
router.post('/visa-tracker/:clientId/appointment', createAppointment);
router.get('/visa-tracker/:clientId/appointment', getAppointment);

// ============= VISA OUTCOME ROUTES =============
router.post('/visa-tracker/:clientId/outcome', createVisaOutcome);
router.get('/visa-tracker/:clientId/outcome', getVisaOutcome);

// ============= LEGACY UPDATE ROUTES (for backward compatibility) =============
// router.put('/visa-tracker/:clientId/agreement', upload.single('document'), updateAgreement);
router.put('/visa-tracker/:clientId/meeting', updateMeeting);
router.put('/visa-tracker/:clientId/documents', upload.array('documents'), updateDocumentCollection);
router.put('/visa-tracker/:clientId/application', upload.single('formFile'), updateVisaApplication);
router.put('/visa-tracker/:clientId/supporting-docs', upload.array('documents'), updateSupportingDocuments);
router.put('/visa-tracker/:clientId/payment', updatePayment);
router.put('/visa-tracker/:clientId/appointment', updateAppointment);
router.put('/visa-tracker/:clientId/outcome', updateVisaOutcome);

export default router;
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
import Client from "../models/client.js";
import VisaTracker from "../models/VisaTracker.js";
import Appointment from "../models/appointment.js";

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

// Get recent activities for dashboard
router.get('/dashboard/recent-activities', async (req, res) => {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    // Get new clients
    const newClients = await Client.find({
      createdAt: { $gte: oneDayAgo }
    }).select('_id name createdAt');

    // Get status updates
    const statusUpdates = await VisaTracker.find({
      'statusHistory.updatedAt': { $gte: oneDayAgo }
    }).select('_id clientId status statusHistory');

    // Get new appointments
    const newAppointments = await Appointment.find({
      createdAt: { $gte: oneDayAgo }
    }).select('_id clientId appointmentDate appointmentTime');

    // Format activities
    const activities = [
      ...newClients.map(client => ({
        type: 'new_client',
        title: 'New Client Application Submitted',
        description: `${client.name} submitted a new application`,
        timestamp: client.createdAt,
        id: client._id
      })),
      ...statusUpdates.map(tracker => ({
        type: 'status_update',
        title: 'Application Status Updated',
        description: `Status updated to ${tracker.status}`,
        timestamp: tracker.statusHistory[tracker.statusHistory.length - 1].updatedAt,
        id: tracker._id
      })),
      ...newAppointments.map(appointment => ({
        type: 'new_appointment',
        title: 'New Appointment Scheduled',
        description: `Appointment scheduled for ${new Date(appointment.appointmentDate).toLocaleDateString()} at ${appointment.appointmentTime}`,
        timestamp: appointment.createdAt,
        id: appointment._id
      }))
    ];

    // Sort activities by timestamp (most recent first)
    activities.sort((a, b) => b.timestamp - a.timestamp);

    res.json(activities);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ message: 'Error fetching recent activities' });
  }
});

export default router;
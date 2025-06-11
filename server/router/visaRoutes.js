import express from "express";

import {
  createVisaTracker,
  getVisaTracker,
  getAllVisaTrackers,
  getBranchVisaTrackers,
  
  // Agreement endpoints
  createAgreement,
  getAgreement,
  
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
  updateVisaOutcome,
  updateVisaTrackerStep
} from "../controllers/visaTrackerController.js";

import upload from "../middleware/upload.js";
import Client from "../models/Client.js";
import VisaTracker from "../models/VisaTracker.js";
import Appointment from "../models/appointment.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// ============= MAIN TRACKER ROUTES =============
router.post('/', authenticateToken, createVisaTracker);
router.get('/:clientId', authenticateToken, getVisaTracker);
router.get('/all', authenticateToken, getAllVisaTrackers);
router.get('/branch/:branchId', authenticateToken, getBranchVisaTrackers);

// ============= AGREEMENT ROUTES =============
router.post('/:clientId/agreement', authenticateToken, createAgreement);
router.get('/:clientId/agreement', authenticateToken, getAgreement);

// ============= MEETING ROUTES =============
router.post('/:clientId/meeting', authenticateToken, createMeeting);
router.get('/:clientId/meeting', authenticateToken, getMeeting);
router.put('/:clientId/meeting', authenticateToken, updateMeeting);

// ============= DOCUMENT COLLECTION ROUTES =============
router.post('/:clientId/documents', upload.array('documents'), authenticateToken, createDocumentCollection);
router.get('/:clientId/documents', authenticateToken, getDocumentCollection);
router.put('/:clientId/documents', upload.array('documents'), authenticateToken, updateDocumentCollection);

// ============= VISA APPLICATION ROUTES =============
router.post('/:clientId/application', upload.single('formFile'), authenticateToken, createVisaApplication);
router.get('/:clientId/application', authenticateToken, getVisaApplication);
router.put('/:clientId/application', upload.single('formFile'), authenticateToken, updateVisaApplication);

// ============= SUPPORTING DOCUMENTS ROUTES =============
router.post('/:clientId/supporting-docs', upload.array('documents'), authenticateToken, createSupportingDocuments);
router.get('/:clientId/supporting-docs', authenticateToken, getSupportingDocuments);
router.put('/:clientId/supporting-docs', upload.array('documents'), authenticateToken, updateSupportingDocuments);

// ============= PAYMENT ROUTES =============
router.post('/:clientId/payment', authenticateToken, createPayment);
router.get('/:clientId/payment', authenticateToken, getPayment);
router.put('/:clientId/payment', authenticateToken, updatePayment);

// ============= APPOINTMENT ROUTES =============
router.post('/:clientId/appointment', authenticateToken, createAppointment);
router.get('/:clientId/appointment', authenticateToken, getAppointment);
router.put('/:clientId/appointment', authenticateToken, updateAppointment);

// ============= VISA OUTCOME ROUTES =============
router.post('/:clientId/outcome', authenticateToken, createVisaOutcome);
router.get('/:clientId/outcome', authenticateToken, getVisaOutcome);
router.put('/:clientId/outcome', authenticateToken, updateVisaOutcome);

// ============= STEP UPDATE ROUTE =============
router.put('/:clientId/step', authenticateToken, updateVisaTrackerStep);

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
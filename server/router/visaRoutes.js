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
import Appointment from "../models/Appointment.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

// ============= MAIN TRACKER ROUTES =============
router.post('/', isAuthenticated, createVisaTracker);
router.get('/:clientId', isAuthenticated, getVisaTracker);
router.get('/all', isAuthenticated, getAllVisaTrackers);
router.get('/branch/:branchId', isAuthenticated, getBranchVisaTrackers);

// ============= AGREEMENT ROUTES =============
router.post('/:clientId/agreement', isAuthenticated, createAgreement);
router.get('/:clientId/agreement', isAuthenticated, getAgreement);

// ============= MEETING ROUTES =============
router.post('/:clientId/meeting', isAuthenticated, createMeeting);
router.get('/:clientId/meeting', isAuthenticated, getMeeting);
router.put('/:clientId/meeting', isAuthenticated, updateMeeting);

// ============= DOCUMENT COLLECTION ROUTES =============
router.post('/:clientId/documents', upload.array('documents'), isAuthenticated, createDocumentCollection);
router.get('/:clientId/documents', isAuthenticated, getDocumentCollection);
router.put('/:clientId/documents', upload.array('documents'), isAuthenticated, updateDocumentCollection);

// ============= VISA APPLICATION ROUTES =============
router.post('/:clientId/application', upload.single('formFile'), isAuthenticated, createVisaApplication);
router.get('/:clientId/application', isAuthenticated, getVisaApplication);
router.put('/:clientId/application', upload.single('formFile'), isAuthenticated, updateVisaApplication);

// ============= SUPPORTING DOCUMENTS ROUTES =============
router.post('/:clientId/supporting-docs', upload.array('documents'), isAuthenticated, createSupportingDocuments);
router.get('/:clientId/supporting-docs', isAuthenticated, getSupportingDocuments);
router.put('/:clientId/supporting-docs', upload.array('documents'), isAuthenticated, updateSupportingDocuments);

// ============= PAYMENT ROUTES =============
router.post('/:clientId/payment', isAuthenticated, createPayment);
router.get('/:clientId/payment', isAuthenticated, getPayment);
router.put('/:clientId/payment', isAuthenticated, updatePayment);

// ============= APPOINTMENT ROUTES =============
router.post('/:clientId/appointment', isAuthenticated, createAppointment);
router.get('/:clientId/appointment', isAuthenticated, getAppointment);
router.put('/:clientId/appointment', isAuthenticated, updateAppointment);

// ============= VISA OUTCOME ROUTES =============
router.post('/:clientId/outcome', isAuthenticated, createVisaOutcome);
router.get('/:clientId/outcome', isAuthenticated, getVisaOutcome);
router.put('/:clientId/outcome', isAuthenticated, updateVisaOutcome);

// ============= STEP UPDATE ROUTE =============
router.put('/:clientId/step', isAuthenticated, updateVisaTrackerStep);

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

router.get('/payments/upcoming', isAuthenticated, async (req, res) => {
    try {
        const now = new Date();
        
        // Find visa trackers with upcoming or overdue payments
        const trackers = await VisaTracker.find({
            'payment.dueDate': { $exists: true, $ne: null },
            'payment.status': { $in: ['PENDING', 'PARTIAL', 'OVERDUE'] }
        })
        .populate('clientId', 'firstName lastName')
        .select('clientId payment')
        .sort({ 'payment.dueDate': 1 });

        // Format the data for the frontend
        const upcomingPayments = trackers.map(tracker => {
            if (!tracker.clientId || !tracker.payment) {
                return null; // Skip if client or payment somehow doesn't exist
            }
            return {
                _id: tracker._id,
                clientName: `${tracker.clientId.firstName} ${tracker.clientId.lastName}`,
                amountDue: tracker.payment.amount,
                dueDate: tracker.payment.dueDate,
                paymentType: tracker.payment.type,
                status: tracker.payment.status,
            };
        }).filter(p => p !== null); // Filter out nulls

        res.json({ success: true, upcomingPayments });
    } catch (error) {
        console.error('Error fetching upcoming visa payments:', error);
        res.status(500).json({ success: false, message: 'Server error fetching upcoming visa payments' });
    }
});

export default router;
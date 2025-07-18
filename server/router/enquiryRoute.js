import express from "express";
import {
  getEnquiries,
  getEnquiry,
  createEnquiry,
  updateEnquiry,
  deleteEnquiry,
  getEnquiryHistory,
  getNextEnquiryId,
  getClientEnquiries,
  createClientEnquiry,
} from "../controllers/enquiriesController.js";
import {
  getEnquiryAgreement,
  createOrUpdateEnquiryAgreement,
} from "../controllers/enquiryAgreementController.js";
import {
  getEnquiryMeeting,
  createOrUpdateEnquiryMeeting,
} from "../controllers/enquiryMeetingController.js";
import {
  getEnquiryTasks,
  createEnquiryTask,
  updateEnquiryTask,
  deleteEnquiryTask,
} from "../controllers/enquiryTaskController.js";
import { sendEmail } from '../config/emailConfig.js';
import Enquiry from '../models/Enquiry.js';
import Client from '../models/Client.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import WhatsAppTemplate from '../models/WhatsAppTemplate.js';
import { isAuthenticated } from "../middleware/auth.js";
import { createEnquiryPayment, getEnquiryPayments } from '../controllers/enquiryPaymentController.js';

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/agreements';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Check for duplicate user - MUST BE BEFORE PARAMETERIZED ROUTES
router.post("/check-duplicate-user", async (req, res) => {
  try {
    const { email, phone } = req.body;
    console.log('Checking for duplicates:', { email, phone });

    if (!email && !phone) {
      return res.status(400).json({
        exists: false,
        message: 'Either email or phone must be provided'
      });
    }

    // Check in enquiries collection
    const existingEnquiry = await Enquiry.findOne({
      $or: [
        { email: email || '' },
        { phone: phone || '' }
      ]
    });

    console.log('Enquiry check result:', existingEnquiry);

    if (existingEnquiry) {
      console.log('Found duplicate in enquiries');
      return res.json({
        exists: true,
        type: 'enquiry',
        userData: {
          _id: existingEnquiry._id,
          firstName: existingEnquiry.firstName,
          lastName: existingEnquiry.lastName,
          email: existingEnquiry.email,
          phone: existingEnquiry.phone
        }
      });
    }

    // Check in clients collection
    const existingClient = await Client.findOne({
      $or: [
        { email: email || '' },
        { phone: phone || '' }
      ]
    });

    console.log('Client check result:', existingClient);

    if (existingClient) {
      console.log('Found duplicate in clients');
      return res.json({
        exists: true,
        type: 'client',
        userData: {
          _id: existingClient._id,
          firstName: existingClient.firstName,
          lastName: existingClient.lastName,
          email: existingClient.email,
          phone: existingClient.phone
        }
      });
    }

    console.log('No duplicates found');
    return res.json({
      exists: false
    });

  } catch (error) {
    console.error('Error checking duplicate user:', error);
    res.status(500).json({ 
      exists: false,
      message: 'Error checking for duplicate user', 
      error: error.message 
    });
  }
});

// GET /api/enquiries - Get all enquiries
router.get("/", getEnquiries);

// GET /api/enquiries/next-id - Get the next available enquiry ID
router.get("/next-id", getNextEnquiryId);

// GET /api/enquiries/:id - Get single enquiry
router.get("/:id", getEnquiry);

// POST /api/enquiries - Create new enquiry
router.post("/", createEnquiry);

// PUT /api/enquiries/:id - Update enquiry
router.put("/:id", updateEnquiry);

// DELETE /api/enquiries/:id - Delete enquiry
router.delete("/:id", deleteEnquiry);

// GET /api/enquiries/:id/history - Get related enquiry/client history
router.get("/:id/history", getEnquiryHistory);

// GET /api/enquiries/client/:clientId - Get all enquiries related to a specific client
router.get("/client/:clientId", getClientEnquiries);

// POST /api/enquiries/client/:clientId - Create a new enquiry for a client
router.post("/client/:clientId", createClientEnquiry);

// Agreement routes
router.get("/:enquiryId/agreement", getEnquiryAgreement);
router.post("/:enquiryId/agreement", upload.single('pdf'), createOrUpdateEnquiryAgreement);

// Add route for serving agreement files
router.get("/agreements/file/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(process.cwd(), 'uploads/agreements', filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: 'File not found'
    });
  }

  // Send the file
  res.sendFile(filePath);
});

// Meeting routes
router.get("/:enquiryId/meeting", getEnquiryMeeting);
router.post("/:enquiryId/meeting", createOrUpdateEnquiryMeeting);

// Task routes
router.get("/:enquiryId/tasks", getEnquiryTasks);
router.post("/:enquiryId/tasks", createEnquiryTask);
router.put("/:enquiryId/tasks/:taskId", updateEnquiryTask);
router.delete("/:enquiryId/tasks/:taskId", deleteEnquiryTask);

// Enquiry Payment Routes
router.post("/:enquiryId/payments", isAuthenticated, createEnquiryPayment);
router.get("/:enquiryId/payments", isAuthenticated, getEnquiryPayments);

// Email route
router.post('/:enquiryId/send-email', async (req, res) => {
    try {
        const { enquiryId } = req.params;
        const { type, data } = req.body;
        
        const enquiry = await Enquiry.findById(enquiryId);
        if (!enquiry) {
            return res.status(404).json({
                success: false,
                message: 'Enquiry not found'
            });
        }

        // Validate email type
        const validTypes = ['enquiryConfirmation', 'taskReminder', 'meetingConfirmation'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email type'
            });
        }

        await sendEmail(enquiry.email, type, data || enquiry);
        
        res.json({
            success: true,
            message: 'Email sent successfully'
        });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to send email'
        });
    }
});

// WhatsApp route
router.post('/:enquiryId/send-whatsapp', async (req, res) => {
    try {
        const { enquiryId } = req.params;
        const { type, data } = req.body;
        
        const enquiry = await Enquiry.findById(enquiryId);
        if (!enquiry) {
            return res.status(404).json({
                success: false,
                message: 'Enquiry not found'
            });
        }

        // Validate WhatsApp type
        const validTypes = ['enquiryConfirmation', 'taskReminder', 'meetingConfirmation'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid WhatsApp type'
            });
        }

        // Get WhatsApp template
        const template = await WhatsAppTemplate.findOne({ 
            type: 'ENQUIRY',
            isActive: true 
        });

        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'No active WhatsApp template found for enquiries'
            });
        }

        // Replace variables in template
        let messageBody = template.body;
        const variables = {
            firstName: enquiry.firstName,
            lastName: enquiry.lastName,
            email: enquiry.email,
            phone: enquiry.phone,
            visaType: enquiry.visaType,
            destinationCountry: enquiry.destinationCountry,
            enquiryStatus: enquiry.enquiryStatus,
            // Add more variables as needed
        };

        // Replace variables in message body
        Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            messageBody = messageBody.replace(regex, value || '');
        });

        // Encode message for WhatsApp URL
        const encodedMessage = encodeURIComponent(messageBody);
        const whatsappUrl = `https://wa.me/${enquiry.phone}?text=${encodedMessage}`;

        res.json({
            success: true,
            url: whatsappUrl,
            message: 'WhatsApp message prepared successfully'
        });
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to send WhatsApp message'
        });
    }
});

export default router;
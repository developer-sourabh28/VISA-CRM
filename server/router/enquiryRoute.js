import express from "express";
import {
  getEnquiries,
  getEnquiry,
  createEnquiry,
  updateEnquiry,
  deleteEnquiry,
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

// GET /api/enquiries/:id - Get single enquiry
router.get("/:id", getEnquiry);

// POST /api/enquiries - Create new enquiry
router.post("/", createEnquiry);

// PUT /api/enquiries/:id - Update enquiry
router.put("/:id", updateEnquiry);

// DELETE /api/enquiries/:id - Delete enquiry
router.delete("/:id", deleteEnquiry);

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

export default router;
import Deadline from "../models/Deadline.js";
import mongoose from "mongoose";
import Branch from "../models/Branch.js";
import User from "../models/User.js";
import Client from "../models/Client.js";
import cron from 'node-cron'; // Import node-cron
import { sendEmail } from './emailTemplateController.js'; // Import sendEmail utility

// In-memory store for scheduled jobs
const scheduledJobs = {};

// Function to schedule a reminder
const scheduleReminder = (deadline) => {
  const dueDate = new Date(deadline.dueDate);
  if (!deadline.reminderTime) {
    console.log(`No reminder time for deadline ${deadline._id}. Not scheduling.`);
    return;
  }

  const [hours, minutes] = deadline.reminderTime.split(':').map(Number);
  dueDate.setHours(hours, minutes, 0, 0);

  const now = new Date();
  if (dueDate <= now) {
    console.log(`Reminder time for deadline ${deadline._id} is in the past. Not scheduling.`);
    return;
  }

  // Cron schedule: minutes hours dayOfMonth month dayOfWeek
  // Example: "0 10 20 4 *" means 10:00 AM on April 20th every year
  const cronSchedule = `${minutes} ${hours} ${dueDate.getDate()} ${dueDate.getMonth() + 1} *`;
  console.log(`Scheduling reminder for deadline ${deadline._id} at: ${cronSchedule}`);

  // Cancel existing job if it exists for this deadline
  if (scheduledJobs[deadline._id]) {
    scheduledJobs[deadline._id].stop();
    console.log(`Stopped existing cron job for deadline ${deadline._id}`);
  }

  const job = cron.schedule(cronSchedule, async () => {
    console.log(`Executing scheduled reminder for deadline ${deadline._id}`);
    const adminEmail = 'sbansotiya@gmail.com'; // Static admin email

    // 1. Send Email Reminder to Admin
    const emailSubject = `Automated Deadline Reminder: ${deadline.clientName} - ${deadline.visaType}`;
    const emailBody = `
      <p>Dear Admin,</p>
      <p>This is an automated reminder for the following deadline:</p>
      <ul>
        <li><strong>Client Name:</strong> ${deadline.clientName}</li>
        <li><strong>Visa Type:</strong> ${deadline.visaType}</li>
        <li><strong>Due Date:</strong> ${new Date(deadline.dueDate).toLocaleDateString()}</li>
        <li><strong>Reminder Time:</strong> ${deadline.reminderTime}</li>
        <li><strong>Client Email:</strong> ${deadline.clientEmail || 'N/A'}</li>
        <li><strong>Client Phone:</strong> ${deadline.clientPhone || 'N/A'}</li>
        <li><strong>Source:</strong> ${deadline.source || 'N/A'}</li>
      </ul>
      <p>Please take necessary action.</p>
    `;
    try {
      await sendEmail(adminEmail, emailSubject, emailBody);
      console.log(`Email reminder sent to admin for deadline ${deadline._id}`);
    } catch (emailError) {
      console.error(`Failed to send email reminder for deadline ${deadline._id}:`, emailError);
    }

    // 2. Generate and Send WhatsApp Link to Admin via Email (for client)
    const whatsappMessageClient = `Dear ${deadline.clientName},

This is a reminder that your ${deadline.type} deadline for ${deadline.visaType} is approaching on ${new Date(deadline.dueDate).toLocaleDateString()}.

Please ensure you complete the necessary actions.

Best regards,
Visa Services Team`;

    const encodedMessageClient = encodeURIComponent(whatsappMessageClient);
    const whatsappLinkClient = `https://wa.me/${deadline.clientPhone}?text=${encodedMessageClient}`;

    const whatsappEmailSubjectClient = `WhatsApp Link for Client (${deadline.clientName}) - Deadline Reminder`;
    const whatsappEmailBodyClient = `
      <p>Dear Admin,</p>
      <p>Here is the WhatsApp link to send a reminder to ${deadline.clientName} regarding their ${deadline.type} deadline:</p>
      <p><a href="${whatsappLinkClient}" target="_blank">Click here to send WhatsApp message to ${deadline.clientName}</a></p>
      <p>Client Phone: ${deadline.clientPhone || 'N/A'}</p>
      <p>Please open this link to send the message.</p>
    `;
    try {
      if (deadline.clientPhone) {
        await sendEmail(adminEmail, whatsappEmailSubjectClient, whatsappEmailBodyClient);
        console.log(`WhatsApp link for client sent to admin for deadline ${deadline._id}`);
      } else {
        console.log(`No client phone for deadline ${deadline._id}. Skipping WhatsApp link email to admin.`);
      }
    } catch (whatsappEmailError) {
      console.error(`Failed to send WhatsApp link email for client for deadline ${deadline._id}:`, whatsappEmailError);
    }

    // 3. Generate and Send WhatsApp Link to Admin via Email (for admin's own reminder)
    const adminWhatsAppNumber = '+919977070504'; // Static Admin WhatsApp Number
    const whatsappMessageAdmin = `Automated Reminder for Deadline:\nClient: ${deadline.clientName}\nVisa Type: ${deadline.visaType}\nDue Date: ${new Date(deadline.dueDate).toLocaleDateString()}\nTime: ${deadline.reminderTime}\n\nAction required.`;

    const encodedMessageAdmin = encodeURIComponent(whatsappMessageAdmin);
    const whatsappLinkAdmin = `https://wa.me/${adminWhatsAppNumber}?text=${encodedMessageAdmin}`;

    const whatsappEmailSubjectAdmin = `Internal WhatsApp Reminder for Deadline: ${deadline.clientName}`;
    const whatsappEmailBodyAdmin = `
      <p>Dear Admin,</p>
      <p>Here is an internal WhatsApp reminder for the deadline of ${deadline.clientName}:</p>
      <p><a href="${whatsappLinkAdmin}" target="_blank">Click here to send reminder to your own WhatsApp</a></p>
      <p>This will open a chat with ${adminWhatsAppNumber} pre-filled with the reminder message.</p>
    `;
    try {
      await sendEmail(adminEmail, whatsappEmailSubjectAdmin, whatsappEmailBodyAdmin);
      console.log(`Internal WhatsApp reminder link sent to admin for deadline ${deadline._id}`);
    } catch (whatsappEmailErrorAdmin) {
      console.error(`Failed to send internal WhatsApp reminder email for deadline ${deadline._id}:`, whatsappEmailErrorAdmin);
    }

    // After the job executes, remove it from the scheduledJobs store
    delete scheduledJobs[deadline._id];
  }, { scheduled: true, timezone: "Asia/Kolkata" }); // Set your desired timezone

  scheduledJobs[deadline._id] = job;
};

// Function to cancel a scheduled reminder
const cancelScheduledReminder = (deadlineId) => {
  if (scheduledJobs[deadlineId]) {
    scheduledJobs[deadlineId].stop();
    delete scheduledJobs[deadlineId];
    console.log(`Canceled scheduled reminder for deadline ${deadlineId}`);
  }
};

// Create a new deadline
export const createDeadline = async (req, res) => {
  try {
    // Get the user's branch from the token payload
    const userBranch = req.user.branch;
    console.log('User branch from token:', userBranch); // Debug log
    console.log('Request body:', req.body); // Debug log

    if (!userBranch) {
      return res.status(400).json({ 
        success: false, 
        message: 'User branch not found in token. Please log out and log in again.' 
      });
    }

    // Get the branch details using branchId
    let branch;
    try {
      // If branchId is provided in the request, use that instead of the user's branch
      const branchId = req.body.branchId;
      console.log('Looking for branch with ID:', branchId); // Debug log

      if (branchId) {
        // Find by branchId
        console.log('Attempting to find branch by branchId:', branchId);
        branch = await Branch.findOne({ branchId });
        console.log('Result of findOne by branchId:', branch);
      } else {
        console.log('No branchId provided, using userBranch:', userBranch);
        branch = await Branch.findOne({ branchName: userBranch });
        console.log('Result of findOne by userBranch:', branch);
      }
      
      console.log('Final branch result:', branch); // Debug log

      if (!branch) {
        return res.status(400).json({ 
          success: false, 
          message: `Branch not found in database. Please ensure the branch "${branchId || userBranch}" exists in the system. Contact administrator if this is incorrect.` 
        });
      }
    } catch (err) {
      console.error('Detailed error finding branch:', err);
      console.error('Error stack:', err.stack);
      return res.status(500).json({
        success: false,
        message: 'Error finding branch information. Please try again.'
      });
    }

    // Set the branchId from the branch
    const deadlineData = {
      ...req.body,
      branchId: branch._id, // Use the _id from the found branch for the reference
      // Ensure reminderTime is handled from req.body
      reminderTime: req.body.reminderTime || null // Store the time
    };

    console.log('Creating deadline with data:', deadlineData); // Debug log

    // Fetch client details to get email and phone
    const client = await Client.findOne({ clientName: req.body.clientName });
    if (client) {
      deadlineData.clientEmail = client.email;
      deadlineData.clientPhone = client.phone;
    }

    const deadline = await Deadline.create(deadlineData);
    
    // Schedule the reminder after successful creation
    if (deadline.dueDate && deadline.reminderTime) {
      scheduleReminder(deadline);
    }

    // Get branch details for response
    const responseData = {
      ...deadline.toObject(),
      branchId: {
        branchName: branch.branchName,
        branchLocation: branch.branchLocation,
        branchId: branch.branchId
      }
    };
    
    res.status(201).json({ success: true, data: responseData });
  } catch (error) {
    console.error('Error in createDeadline:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Error creating deadline. Please try again.' 
    });
  }
};

// Update a deadline
export const updateDeadline = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = { ...req.body };

    // Remove branchId from updatedData if it's an object (populated field)
    if (typeof updatedData.branchId === 'object' && updatedData.branchId !== null) {
      updatedData.branchId = updatedData.branchId.branchId; // Ensure we get the string ID
    }

    // Fetch the existing deadline to cancel its job
    const existingDeadline = await Deadline.findById(id);
    if (!existingDeadline) {
      return res.status(404).json({ success: false, message: 'Deadline not found.' });
    }

    // Cancel any existing scheduled reminder for this deadline
    cancelScheduledReminder(id);

    const deadline = await Deadline.findByIdAndUpdate(
      id,
      updatedData,
      { new: true, runValidators: true }
    ).populate('branchId', 'branchName branchLocation branchId');

    if (!deadline) {
      return res.status(404).json({ success: false, message: 'Deadline not found' });
    }

    // Schedule a new reminder with the updated details
    if (deadline.dueDate && deadline.reminderTime) {
      scheduleReminder(deadline);
    }

    res.json({ success: true, data: deadline });
  } catch (error) {
    console.error('Error in updateDeadline:', error);
    res.status(400).json({ success: false, message: error.message || 'Error updating deadline.' });
  }
};

// Get all deadlines
export const getDeadlines = async (req, res) => {
  try {
    const filter = {};
    
    // Get user's branch and role from token
    const userBranch = req.user.branch;
    const userRole = req.user.role?.toUpperCase();
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

    console.log('User branch:', userBranch);
    console.log('User role:', userRole);
    console.log('Is admin:', isAdmin);
    console.log('Query params:', req.query);

    // Filter by history status
    if (req.query.history === "true") {
      filter.history = true;
    } else {
      filter.history = { $ne: true };
    }

    // Branch filtering logic
    if (!isAdmin) {
      // Non-admin users can only see their branch's data
      if (userBranch) {
        try {
          const userBranchDoc = await Branch.findOne({ 
            $or: [
              { branchId: userBranch },
              { branchName: userBranch }
            ]
          });
          if (userBranchDoc) {
            filter.branchId = userBranchDoc._id;
          }
        } catch (err) {
          console.error('Error finding user branch:', err);
        }
      }
    } else {
      // Admin users can see all data or filter by branch
      if (req.query.branchId && req.query.branchId !== 'all') {
        try {
          const requestedBranch = await Branch.findOne({ 
            $or: [
              { branchId: req.query.branchId },
              { branchName: req.query.branchId }
            ]
          });
          if (requestedBranch) {
            filter.branchId = requestedBranch._id;
          }
        } catch (err) {
          console.error('Error finding requested branch:', err);
        }
      }
    }

    console.log('Final filter:', filter);

    // Type filter
    if (req.query.type) {
      filter.type = req.query.type;
    }

    // Date range filter
    if (req.query.startDate && req.query.endDate) {
      filter.dueDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    // Search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { clientName: searchRegex },
        { visaType: searchRegex }
      ];
    }

    const deadlines = await Deadline.find(filter)
      .populate('branchId', 'branchName branchLocation branchId')
      .sort({ dueDate: 1 });
    
    console.log('Found deadlines:', deadlines.length);
    
    // Get client details for each deadline
    const deadlinesWithDetails = await Promise.all(
      deadlines.map(async (deadline) => {
        const deadlineObject = deadline.toObject();
        let clientEmail = deadlineObject.clientEmail;
        let clientPhone = deadlineObject.clientPhone;

        // If clientEmail or clientPhone are missing from the deadline, try to get them from the Client model
        if (!clientEmail || !clientPhone) {
          const client = await Client.findOne({ clientName: deadlineObject.clientName });
          if (client) {
            if (!clientEmail) clientEmail = client.email;
            if (!clientPhone) clientPhone = client.phone;
          }
        }

        return {
          ...deadlineObject,
          clientEmail: clientEmail || null,
          clientPhone: clientPhone || null
        };
      })
    );

    res.json({ 
      success: true, 
      data: deadlinesWithDetails
    });
  } catch (error) {
    console.error('Error in getDeadlines:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Restore a deadline
export const restoreDeadline = async (req, res) => {
  try {
    // Get user's branch
    const userBranch = req.user.branch;
    if (!userBranch) {
      return res.status(400).json({
        success: false,
        message: 'User branch not found in token'
      });
    }

    // Get branch details
    const userBranchDoc = await Branch.findOne({ branchName: userBranch });
    if (!userBranchDoc) {
      return res.status(400).json({
        success: false,
        message: 'Branch not found in database'
      });
    }

    // Find the deadline
    const deadline = await Deadline.findById(req.params.id);
    if (!deadline) {
      return res.status(404).json({
        success: false,
        message: 'Deadline not found'
      });
    }

    // Check if user has access to this deadline
    if (userBranchDoc.branchId !== 'all' && deadline.branchId !== userBranchDoc.branchId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify this deadline'
      });
    }

    // Update the deadline
    const updatedDeadline = await Deadline.findByIdAndUpdate(
      req.params.id,
      { history: false },
      { new: true }
    ).populate('branchId', 'branchName branchLocation branchId'); // Populate to get full data for scheduling

    // Reschedule the reminder after restoration
    if (updatedDeadline.dueDate && updatedDeadline.reminderTime) {
      scheduleReminder(updatedDeadline);
    }

    res.json({ success: true, data: updatedDeadline });
  } catch (error) {
    console.error('Error in restoreDeadline:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a deadline permanently (hard delete)
export const deleteDeadline = async (req, res) => {
  try {
    const { id } = req.params;
    const deadline = await Deadline.findByIdAndDelete(id);

    if (!deadline) {
      return res.status(404).json({ success: false, message: 'Deadline not found.' });
    }

    // Cancel any scheduled reminder for this deleted deadline
    cancelScheduledReminder(id);

    res.json({ success: true, message: 'Deadline deleted successfully.' });
  } catch (error) {
    console.error('Error in deleteDeadline:', error);
    res.status(500).json({ success: false, message: error.message || 'Error deleting deadline.' });
  }
};
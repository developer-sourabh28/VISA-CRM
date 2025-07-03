import Reminder from "../models/Reminder.js";
import mongoose from "mongoose";
import { sendEmail } from './emailTemplateController.js';
import { sendWhatsAppMessageFromTemplate } from './whatsappTemplateController.js';

// @desc    Get all reminders
// @route   GET /api/reminders
// @access  Private
export const getReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find()
      .sort({ dueDate: 1 })
      .populate('relatedTo', 'firstName lastName email phone')
      .populate('assignedTo', 'name email');

    res.json({ success: true, data: reminders });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new reminder
// @route   POST /api/reminders
// @access  Private
export const createReminder = async (req, res) => {
  try {
    const {
      title,
      description,
      reminderDate,
      reminderTime,
      priority,
      repeat,
      notificationMethod,
      type,
      email,
      mobileNumber,
      clientName
    } = req.body;

    // Combine date and time
    const dueDate = new Date(`${reminderDate}T${reminderTime}`);

    // Create reminder object with all fields
    const reminder = new Reminder({
      title,
      description,
      reminderDate: dueDate,
      reminderTime,
      priority,
      repeat,
      notificationMethod,
      type,
      email,
      mobileNumber,
      clientName,
      status: 'PENDING',
      category: type, // Set category same as type
      dueDate // Add dueDate field
    });

    await reminder.save();
    res.status(201).json({ success: true, data: reminder });
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create birthday reminder for an enquiry
// @route   POST /api/reminders/birthday
// @access  Private
export const createBirthdayReminder = async (enquiry) => {
  try {
    if (!enquiry.dateOfBirth) {
      console.log('No date of birth provided for enquiry:', enquiry._id);
      return null;
    }

    // Create a reminder for the next birthday
    const birthday = new Date(enquiry.dateOfBirth);
    const today = new Date();
    
    // Set the birthday to this year
    const nextBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());

    // If the birthday has already passed this year, set it for next year
    if (nextBirthday < today) {
      nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
    }

    console.log('Creating birthday reminder:', {
      enquiryId: enquiry._id,
      name: `${enquiry.firstName} ${enquiry.lastName}`,
      birthday: birthday,
      nextBirthday: nextBirthday,
      email: enquiry.email,
      mobileNumber: enquiry.phone
    });

    const reminder = new Reminder({
      type: 'BIRTHDAY',
      category: 'BIRTHDAY',
      title: `Birthday Reminder - ${enquiry.firstName} ${enquiry.lastName}`,
      description: `Birthday reminder for ${enquiry.firstName} ${enquiry.lastName}`,
      dueDate: nextBirthday,
      relatedTo: enquiry._id,
      relatedToModel: 'Enquiry',
      priority: 'HIGH',
      status: 'PENDING',
      email: enquiry.email,
      mobileNumber: enquiry.phone
    });

    const savedReminder = await reminder.save();
    console.log('Birthday reminder saved:', savedReminder);
    return savedReminder;
  } catch (error) {
    console.error('Error creating birthday reminder:', error);
    throw error;
  }
};

// @desc    Send birthday message
// @route   POST /api/reminders/birthday
// @access  Private
export const sendBirthdayMessage = async (req, res) => {
  try {
    const { reminderId, messageType } = req.body;
    const reminder = await Reminder.findById(reminderId)
      .populate('relatedTo', 'firstName lastName email phone');

    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }

    const { relatedTo } = reminder;
    let result;

    if (messageType === 'email') {
      result = await sendEmail(
        relatedTo.email,
        `Happy Birthday ${relatedTo.firstName}!`,
        `<h2>Dear ${relatedTo.firstName} ${relatedTo.lastName},</h2>
        <p>Wishing you a very happy birthday! May this special day bring you joy and happiness.</p>
        <p>Best regards,<br>Visa Services Team</p>`
      );
    } else if (messageType === 'whatsapp') {
      result = await sendWhatsAppMessageFromTemplate({
        type: 'BIRTHDAY',
        deadline: {
          clientName: `${relatedTo.firstName} ${relatedTo.lastName}`,
          clientPhone: relatedTo.phone
        }
      });
    }

    // Update reminder status
    reminder.status = 'COMPLETED';
    await reminder.save();

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error sending birthday message:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark reminder as complete
// @route   PATCH /api/reminders/:id/complete
// @access  Private
export const markReminderComplete = async (req, res) => {
  try {
    const reminder = await Reminder.findByIdAndUpdate(
      req.params.id,
      { status: 'COMPLETED' },
      { new: true }
    );
    res.json({ success: true, data: reminder });
  } catch (error) {
    console.error('Error marking reminder complete:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete reminder
// @route   DELETE /api/reminders/:id
// @access  Private
export const deleteReminder = async (req, res) => {
  try {
    await Reminder.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get due reminders
// @route   GET /api/reminders/due
// @access  Private
export const getDueReminders = async (req, res) => {
  try {
    const now = new Date();
    const reminders = await Reminder.find({
      status: "Pending",
      reminderDate: { $lte: now },
    })
      .populate("client", "firstName lastName email")
      .populate("assignedTo", "firstName lastName email");

    res.status(200).json({
      success: true,
      count: reminders.length,
      data: reminders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Send reminder message
// @route   POST /api/reminders/:id/send-message
// @access  Private
export const sendReminderMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { messageType } = req.body;

    const reminder = await Reminder.findById(id);
    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }

    if (messageType === 'email') {
      if (!reminder.email) {
        return res.status(400).json({ success: false, message: 'No email address available for this reminder' });
      }

      const emailSubject = `Reminder: ${reminder.title}`;
      const emailBody = `
        <h2>Dear ${reminder.clientName},</h2>
        <p>${reminder.description}</p>
        <p>Date: ${new Date(reminder.reminderDate).toLocaleDateString()}</p>
        <p>Time: ${reminder.reminderTime}</p>
        <p>Best regards,<br>Visa Services Team</p>
      `;

      await sendEmail(reminder.email, emailSubject, emailBody);
      res.json({ success: true, message: 'Email sent successfully' });
    } else if (messageType === 'whatsapp') {
      if (!reminder.mobileNumber) {
        return res.status(400).json({ success: false, message: 'No mobile number available for this reminder' });
      }

      // Format the phone number (remove any spaces, dashes, or country code)
      const formattedPhone = reminder.mobileNumber.replace(/[\s-+]/g, '');
      
      // Create WhatsApp message
      const messageBody = `Dear ${reminder.clientName},\n\n${reminder.description}\n\nDate: ${new Date(reminder.reminderDate).toLocaleDateString()}\nTime: ${reminder.reminderTime}\n\nBest regards,\nVisa Services Team`;

      // Encode message for WhatsApp URL
      const encodedMessage = encodeURIComponent(messageBody);
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;

      res.json({
        success: true,
        message: 'WhatsApp link generated successfully',
        data: { whatsappUrl }
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid message type' });
    }
  } catch (error) {
    console.error('Error sending reminder message:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRemindersForEnquiry = async (req, res) => {
  try {
    const { enquiryId } = req.params;
    const reminders = await Reminder.find({
      relatedTo: enquiryId,
      relatedToModel: 'Enquiry'
    }).sort({ reminderDate: 1 });
    res.json({ success: true, data: reminders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}; 
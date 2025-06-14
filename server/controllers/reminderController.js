import Reminder from "../models/Reminder.js";
import mongoose from "mongoose";

// @desc    Get all reminders
// @route   GET /api/reminders
// @access  Private
export const getReminders = async (req, res) => {
  try {
    // Only show reminders created by the current user
    const reminders = await Reminder.find({ createdBy: req.user._id })
      .populate("client", "firstName lastName")
      .populate("assignedTo", "firstName lastName")
      .populate("branch", "name")
      .sort({ reminderDate: 1, reminderTime: 1 });

    res.status(200).json({
      success: true,
      count: reminders.length,
      data: reminders,
    });
  } catch (error) {
    console.error('Error in getReminders:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create new reminder
// @route   POST /api/reminders
// @access  Private
export const createReminder = async (req, res) => {
  try {
    const reminder = await Reminder.create({
      ...req.body,
      assignedTo: req.user._id,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: reminder,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Mark reminder as complete
// @route   PATCH /api/reminders/:id/complete
// @access  Private
export const markReminderComplete = async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: "Reminder not found",
      });
    }

    reminder.status = "Completed";
    await reminder.save();

    res.status(200).json({
      success: true,
      data: reminder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete reminder
// @route   DELETE /api/reminders/:id
// @access  Private
export const deleteReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      createdBy: req.user._id // Only allow deletion if created by the current user
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: "Reminder not found or you don't have permission to delete it",
      });
    }

    await reminder.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
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
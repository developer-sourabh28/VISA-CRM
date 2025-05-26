import Deadline from "../models/Deadline.js";

// Create a new deadline
export const createDeadline = async (req, res) => {
  try {
    const deadline = await Deadline.create(req.body);
    res.status(201).json({ success: true, data: deadline });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all deadlines
export const getDeadlines = async (req, res) => {
  try {
    const filter = {};
    if (req.query.history === "true") filter.history = true;
    else filter.history = { $ne: true };
    const deadlines = await Deadline.find(filter).sort({ dueDate: 1 });
    res.json({ success: true, data: deadlines });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Restore a deadline
export const restoreDeadline = async (req, res) => {
  try {
    const deadline = await Deadline.findByIdAndUpdate(
      req.params.id,
      { archived: false },
      { new: true }
    );
    res.json({ success: true, data: deadline });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
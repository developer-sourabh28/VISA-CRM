import Enquiry from '../models/Enquiry.js';

// Get all enquiries
export const getEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    res.json(enquiries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch enquiries' });
  }
};

// Create a new enquiry
export const createEnquiry = async (req, res) => {
  try {
    const enquiry = new Enquiry(req.body);
    await enquiry.save();
    res.status(201).json(enquiry);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create enquiry', details: err.message });
  }
};

// Update an enquiry
export const updateEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const enquiry = await Enquiry.findByIdAndUpdate(id, req.body, { new: true });
    if (!enquiry) return res.status(404).json({ error: 'Enquiry not found' });
    res.json(enquiry);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update enquiry', details: err.message });
  }
};

// Delete an enquiry
export const deleteEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const enquiry = await Enquiry.findByIdAndDelete(id);
    if (!enquiry) return res.status(404).json({ error: 'Enquiry not found' });
    res.json({ message: 'Enquiry deleted' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete enquiry', details: err.message });
  }
};
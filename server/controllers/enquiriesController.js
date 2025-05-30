import Enquiry from '../models/Enquiry.js';
import { sendEmail } from '../config/emailConfig.js';

// Get all enquiries
export const getEnquiries = async (req, res) => {
  try {
    const { status, branch, assignedConsultant } = req.query;
    let query = {};

    // Add filters if provided
    if (status) query.enquiryStatus = status;
    if (branch) query.branch = branch;
    if (assignedConsultant) query.assignedConsultant = assignedConsultant;

    const enquiries = await Enquiry.find(query)
      .sort({ createdAt: -1 })
      .select('-__v'); // Exclude version key

    res.json({ success: true, data: enquiries });
  } catch (err) {
    console.error('Error fetching enquiries:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch enquiries',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get single enquiry
export const getEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id).select('-__v');
    if (!enquiry) {
      return res.status(404).json({ 
        success: false, 
        error: 'Enquiry not found' 
      });
    }
    res.json({ success: true, data: enquiry });
  } catch (err) {
    console.error('Error fetching enquiry:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch enquiry',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Create a new enquiry
export const createEnquiry = async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ['firstName','lastName', 'email', 'phone', 'nationality', 'currentCountry', 'visaType', 'destinationCountry'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        missingFields
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    const enquiry = new Enquiry(req.body);
    await enquiry.save();

    // Send confirmation email
    try {
      await sendEmail(enquiry.email, 'enquiryConfirmation', enquiry);
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({ 
      success: true, 
      data: enquiry,
      message: 'Enquiry created successfully'
    });
  } catch (error) {
    console.error('Error in createEnquiry:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update an enquiry
export const updateEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if enquiry exists
    const existingEnquiry = await Enquiry.findById(id);
    if (!existingEnquiry) {
      return res.status(404).json({ 
        success: false, 
        error: 'Enquiry not found' 
      });
    }

    // Update enquiry
    const enquiry = await Enquiry.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: Date.now() },
      { 
        new: true,
        runValidators: true
      }
    ).select('-__v');

    res.json({ 
      success: true, 
      data: enquiry,
      message: 'Enquiry updated successfully'
    });
  } catch (err) {
    console.error('Error updating enquiry:', err);
    res.status(400).json({ 
      success: false, 
      error: 'Failed to update enquiry',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Delete an enquiry
export const deleteEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if enquiry exists
    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      return res.status(404).json({ 
        success: false, 
        error: 'Enquiry not found' 
      });
    }

    await Enquiry.findByIdAndDelete(id);
    
    res.json({ 
      success: true, 
      message: 'Enquiry deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting enquiry:', err);
    res.status(400).json({ 
      success: false, 
      error: 'Failed to delete enquiry',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
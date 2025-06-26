import Enquiry from '../models/Enquiry.js';
import Client from '../models/Client.js'; // Import Client model
import { sendEmail } from '../config/emailConfig.js';

// Get all enquiries
export const getEnquiries = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, branchId, source } = req.query;
    const query = {};

    // Add status filter if provided
    if (status) {
      query.enquiryStatus = status;
    }

    // Add source filter if provided
    if (source) {
      if (source.includes(',')) {
        // Handle multiple sources
        query.enquirySource = { $in: source.split(',').map(s => s.trim()) };
      } else {
        query.enquirySource = source;
      }
    }

    // Add branch filter if provided and not 'all'
    if (branchId && branchId !== 'all') {
      query.branch = branchId;
    }

    const enquiries = await Enquiry.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Enquiry.countDocuments(query);

    res.json({
      data: enquiries,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single enquiry
export const getEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id)
      .select('-__v')
      .populate('branchId', 'name'); // Populate branch details if needed

    if (!enquiry) {
      return res.status(404).json({ 
        success: false, 
        error: 'Enquiry not found' 
      });
    }

    // Log the enquiry data for debugging
    console.log('Fetched enquiry:', {
      id: enquiry._id,
      firstName: enquiry.firstName,
      lastName: enquiry.lastName,
      email: enquiry.email,
      phone: enquiry.phone,
      branch: enquiry.branch,
      branchId: enquiry.branchId
    });

    res.json({ 
      success: true, 
      data: enquiry 
    });
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

    // At the top of your createEnquiry function
    const allowDuplicate = req.body.allowDuplicate === true || req.body.allowDuplicate === 'true';

    // Only do duplicate check if allowDuplicate is not true
    if (!allowDuplicate) {
      const { email, phone } = req.body;

      const existingEnquiry = await Enquiry.findOne({ $or: [{ email }, { phone }] });
      if (existingEnquiry) {
        return res.status(409).json({ // 409 Conflict
          success: false,
          message: 'An enquiry with this email or phone already exists.',
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

      const existingClient = await Client.findOne({ $or: [{ email }, { phone }] });
      if (existingClient) {
        return res.status(409).json({ // 409 Conflict
          success: false,
          message: 'A client with this email or phone already exists.',
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

export const getEnquiryHistory = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find the original enquiry to get email and phone
    const originalEnquiry = await Enquiry.findById(id).select('email phone');
    if (!originalEnquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    const { email, phone } = originalEnquiry;

    // Build the query condition
    const orConditions = [];
    if (email) orConditions.push({ email });
    if (phone) orConditions.push({ phone });

    // If no email or phone, no history to find
    if (orConditions.length === 0) {
      return res.json({ success: true, data: { enquiries: [], clients: [] } });
    }

    // 2. Find all enquiries with the same email or phone, excluding the current one.
    const historicalEnquiries = await Enquiry.find({
      $or: orConditions,
      _id: { $ne: id } // Exclude the current enquiry
    }).sort({ createdAt: -1 });

    // 3. Find all clients with the same email or phone
    const historicalClients = await Client.find({
      $or: orConditions
    }).sort({ createdAt: -1 });


    res.json({ success: true, data: {
        enquiries: historicalEnquiries,
        clients: historicalClients
    }});

  } catch (error) {
    console.error('Error fetching enquiry history:', error);
    res.status(500).json({ success: false, message: 'Server error fetching history' });
  }
};

export const getNextEnquiryId = async (req, res) => {
  try {
    const enquiries = await Enquiry.find({}, 'enquiryId');
    const clients = await Client.find({}, 'applicantId');

    let maxNum = 0;

    const extractMaxNum = (records, idField) => {
      records.forEach(record => {
        const id = record[idField];
        if (id && /^E\d{6}$/.test(id)) {
          const num = parseInt(id.slice(1), 10);
          if (num > maxNum) {
            maxNum = num;
          }
        }
      });
    };

    extractMaxNum(enquiries, 'enquiryId');
    extractMaxNum(clients, 'applicantId');

    const newId = `E${(maxNum + 1).toString().padStart(6, "0")}`;

    res.json({ success: true, nextEnquiryId: newId });
  } catch (error) {
    console.error('Error generating next enquiry ID:', error);
    res.status(500).json({ success: false, message: 'Could not generate next enquiry ID' });
  }
};
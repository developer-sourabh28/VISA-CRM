import Client from '../models/Client.js';
import Enquiry from '../models/Enquiry.js';
import Branch from '../models/Branch.js';
import mongoose from 'mongoose';
// @desc    Get all clients
export const getClients = async (req, res) => {
  try {
    const query = {};

    // Get user's branch and role from token
    const userBranch = req.user.branch;
    const userRole = req.user.role?.toUpperCase();
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

    if (!userBranch) {
      return res.status(400).json({
        success: false,
        message: 'User branch not found in token'
      });
    }

    // Get branch details
    let userBranchDoc;
    try {
      userBranchDoc = await Branch.findOne({ branchName: userBranch });
      if (!userBranchDoc) {
        // If branch not found by name, try to find by branchId
        userBranchDoc = await Branch.findOne({ branchId: userBranch });
      }
    } catch (err) {
      console.error('Error finding branch:', err);
      return res.status(500).json({
        success: false,
        message: 'Error finding branch information'
      });
    }

    // Branch filtering logic
    if (!isAdmin) {
      // Non-admin users can only see their branch's data
      if (userBranchDoc && userBranchDoc.branchId !== 'all') {
        query.branchId = userBranchDoc._id;
      }
    } else {
      // Admin users can see all data or filter by branch
      if (req.query.branchId && req.query.branchId !== 'all') {
        try {
          const requestedBranch = await Branch.findOne({ branchId: req.query.branchId });
          if (requestedBranch) {
            query.branchId = requestedBranch._id;
          }
        } catch (err) {
          console.error('Error finding requested branch:', err);
          // Continue without branch filter if branch not found
        }
      }
    }

    // Status filter
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Consultant filter
    if (req.query.consultant) {
      query.assignedConsultant = req.query.consultant;
    }

    // Visa type filter
    if (req.query.visaType) {
      query.visaType = req.query.visaType;
    }

    // Search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { passportNumber: searchRegex },
        { phone: searchRegex }
      ];
    }

    // Date range filter
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const total = await Client.countDocuments(query);

    const clients = await Client.find(query)
      .populate('assignedConsultant', 'firstName lastName email')
      .populate('branchId', 'branchName branchLocation branchId')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    // Get branch statistics for admin users
    let branchStats = null;
    if (isAdmin) {
      try {
        branchStats = await Client.aggregate([
          {
            $group: {
              _id: '$branchId',
              count: { $sum: 1 },
              activeClients: {
                $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] }
              }
            }
          },
          {
            $lookup: {
              from: 'branches',
              localField: '_id',
              foreignField: '_id',
              as: 'branchDetails'
            }
          },
          {
            $unwind: '$branchDetails'
          },
          {
            $project: {
              branchName: '$branchDetails.branchName',
              totalClients: '$count',
              activeClients: '$activeClients'
            }
          }
        ]);
      } catch (err) {
        console.error('Error getting branch statistics:', err);
        // Continue without branch statistics if there's an error
      }
    }

    res.status(200).json({
      success: true,
      count: clients.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
      data: clients,
      branchStats: isAdmin ? branchStats : null
    });
  } catch (error) {
    console.error('Error in getClients:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single client
export const getClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).populate(
      'assignedConsultant',
      'firstName lastName email'
    );

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    res.status(200).json({ success: true, data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new client
export const createClient = async (req, res) => {
  try {
    // Remove createdAt if accidentally sent from client
    if (req.body.createdAt) {
      delete req.body.createdAt;
    }

    // Get user's branch from token
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

    // Set the branchId based on user's branch
    // If user is from a specific branch, use that branch
    // If user has access to all branches, use the branchId from request or default branch
    let branchId = userBranchDoc._id;
    if (userBranchDoc.branchId === 'all' && req.body.branchId) {
      const requestedBranch = await Branch.findOne({ branchId: req.body.branchId });
      if (requestedBranch) {
        branchId = requestedBranch._id;
      }
    }

    const clientData = {
      ...req.body,
      branchId
    };

    const client = new Client(clientData);
    await client.save();

    // Populate branch details before sending response
    const populatedClient = await Client.findById(client._id)
      .populate('branchId', 'branchName branchLocation branchId')
      .populate('assignedConsultant', 'firstName lastName email');

    res.status(201).json({ success: true, data: populatedClient });
  } catch (error) {
    console.error('Error in createClient:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update client
export const updateClient = async (req, res) => {
  try {
    let client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    client = await Client.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('assignedTo', 'firstName lastName email');

    res.status(200).json({ success: true, data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete client
export const deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    await client.remove();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get client statistics
export const getClientStats = async (req, res) => {
  try {
    const totalClients = await Client.countDocuments();
    const activeClients = await Client.countDocuments({ status: 'Active' });

    const nationalityStats = await Client.aggregate([
      { $group: { _id: '$nationality', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const assignmentStats = await Client.aggregate([
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
    ]);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newClients = await Client.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    res.status(200).json({
      success: true,
      data: {
        totalClients,
        activeClients,
        newClients,
        nationalityStats,
        assignmentStats,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// get client by id
export const getClientById = async (clientId) => {
  try {
    const response = await fetch(`/api/clients/${clientId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch client details');
    }
    
    const result = await response.json();
    
    // Access the data property as per your API response structure
    return result.data;
  } catch (error) {
    console.error('Error fetching client details:', error);
    throw error;
  }
};


//client convert api

// @desc    Convert enquiry to client
export const convertEnquiryToClient = async (req, res) => {
    try {
        const { enquiryId } = req.body;
        console.log("Converting enquiry to client:", { enquiryId });

        if (!enquiryId) {
            return res.status(400).json({ success: false, message: 'Enquiry ID is required' });
        }

        const enquiry = await Enquiry.findById(enquiryId);
        console.log("Found enquiry:", enquiry);

        if (!enquiry) {
            return res.status(404).json({ success: false, message: 'Enquiry not found' });
        }

        // Validate required fields
        if (!enquiry.firstName || !enquiry.lastName) {
            console.log("Missing required fields:", { 
                firstName: enquiry.firstName, 
                lastName: enquiry.lastName 
            });
            return res.status(400).json({ 
                success: false, 
                message: 'Enquiry must have first name and last name to convert to client' 
            });
        }

        // Find the branch based on the branch name
        let branch;
        if (enquiry.branchId) {
            branch = await Branch.findById(enquiry.branchId);
            console.log("Found branch by ID:", branch);
        } else {
            branch = await Branch.findOne({ branchName: enquiry.branch });
            console.log("Found branch by name:", branch);
        }

        if (!branch) {
            // If no branch is found, get the default branch
            branch = await Branch.findOne();
            console.log("Using default branch:", branch);
            if (!branch) {
                return res.status(400).json({ success: false, message: 'No branch found in the system' });
            }
        }

        // Create new client with validated data
        const newClient = new Client({
            firstName: enquiry.firstName,
            lastName: enquiry.lastName,
            email: enquiry.email || '',
            phone: enquiry.phone || '',
            address: {}, // default empty object
            passportNumber: enquiry.passportNumber || '',
            dateOfBirth: enquiry.dateOfBirth || null,
            nationality: enquiry.nationality || '',
            profileImage: '',
            assignedConsultant: enquiry.assignedConsultant || 'John Smith',
            visaType: enquiry.visaType || '',
            visaStatus: {}, // default empty
            notes: enquiry.notes || '',
            status: "Active",
            branchId: branch._id // Use the found branch's ID
        });

        console.log("Created new client object:", newClient);

        // Validate the client data before saving
        const validationError = newClient.validateSync();
        if (validationError) {
            console.log("Client validation error:", validationError);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationError.errors
            });
        }

        await newClient.save();
        console.log("Saved new client:", newClient);

        await enquiry.deleteOne();
        console.log("Deleted original enquiry");

        return res.status(201).json({
            success: true,
            message: "Enquiry converted to client successfully.",
            data: newClient
        });

    } catch (error) {
        console.error("Error in convertEnquiryToClient:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

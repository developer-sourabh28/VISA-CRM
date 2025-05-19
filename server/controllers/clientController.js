const Client = require('../models/Client');

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private
exports.getClients = async (req, res) => {
  try {
    // Build query based on filter parameters
    const query = {};
    
    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Filter by assigned user if provided
    if (req.query.assignedTo) {
      query.assignedTo = req.query.assignedTo;
    }

    // Search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { passportNumber: searchRegex }
      ];
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await Client.countDocuments(query);
    
    // Execute query with pagination and populate assigned user
    const clients = await Client.find(query)
      .populate('assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: clients.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      },
      data: clients
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single client
// @route   GET /api/clients/:id
// @access  Private
exports.getClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email');

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.status(200).json({
      success: true,
      data: client
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new client
// @route   POST /api/clients
// @access  Private
exports.createClient = async (req, res) => {
  try {
    // Check if client with email already exists
    const existingClient = await Client.findOne({ email: req.body.email });
    if (existingClient) {
      return res.status(400).json({
        success: false,
        message: 'Client with this email already exists'
      });
    }

    // Create client
    const client = await Client.create({
      ...req.body,
      // Assign the client to the current user if not specified
      assignedTo: req.body.assignedTo || req.user.id
    });

    res.status(201).json({
      success: true,
      data: client
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private
exports.updateClient = async (req, res) => {
  try {
    let client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Update client
    client = await Client.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('assignedTo', 'firstName lastName email');

    res.status(200).json({
      success: true,
      data: client
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private
exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    await client.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get client statistics
// @route   GET /api/clients/stats
// @access  Private
exports.getClientStats = async (req, res) => {
  try {
    // Get total client count
    const totalClients = await Client.countDocuments();
    
    // Get active client count
    const activeClients = await Client.countDocuments({ status: 'Active' });
    
    // Get count by nationality (top 5)
    const nationalityStats = await Client.aggregate([
      { $group: { _id: "$nationality", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Get count by assigned user
    const assignmentStats = await Client.aggregate([
      { $group: { _id: "$assignedTo", count: { $sum: 1 } } }
    ]);
    
    // Get clients registered in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newClients = await Client.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        totalClients,
        activeClients,
        newClients,
        nationalityStats,
        assignmentStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

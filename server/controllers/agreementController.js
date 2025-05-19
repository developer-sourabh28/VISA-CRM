const Agreement = require('../models/Agreement');
const Client = require('../models/Client');

// @desc    Get all agreements
// @route   GET /api/agreements
// @access  Private
exports.getAgreements = async (req, res) => {
  try {
    // Build query based on filter parameters
    const query = {};
    
    // Filter by client if provided
    if (req.query.client) {
      query.client = req.query.client;
    }
    
    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Filter by agreement type if provided
    if (req.query.agreementType) {
      query.agreementType = req.query.agreementType;
    }

    // Search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { agreementType: searchRegex },
        { description: searchRegex }
      ];
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await Agreement.countDocuments(query);
    
    // Execute query with pagination and populate client and created by
    const agreements = await Agreement.find(query)
      .populate('client', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: agreements.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      },
      data: agreements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single agreement
// @route   GET /api/agreements/:id
// @access  Private
exports.getAgreement = async (req, res) => {
  try {
    const agreement = await Agreement.findById(req.params.id)
      .populate('client', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName');

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: 'Agreement not found'
      });
    }

    res.status(200).json({
      success: true,
      data: agreement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new agreement
// @route   POST /api/agreements
// @access  Private
exports.createAgreement = async (req, res) => {
  try {
    // Check if client exists
    const client = await Client.findById(req.body.client);
    if (!client) {
      return res.status(400).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Create agreement
    const agreement = await Agreement.create({
      ...req.body,
      createdBy: req.user.id
    });

    // Populate client and created by
    const populatedAgreement = await Agreement.findById(agreement._id)
      .populate('client', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      data: populatedAgreement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update agreement
// @route   PUT /api/agreements/:id
// @access  Private
exports.updateAgreement = async (req, res) => {
  try {
    let agreement = await Agreement.findById(req.params.id);

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: 'Agreement not found'
      });
    }

    // Update sent date if status is changing to Sent
    if (req.body.status === 'Sent' && agreement.status !== 'Sent') {
      req.body.sentAt = Date.now();
    }

    // Update signed date if status is changing to Signed
    if (req.body.status === 'Signed' && agreement.status !== 'Signed') {
      req.body.signedAt = Date.now();
    }

    // Update agreement
    agreement = await Agreement.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    )
      .populate('client', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: agreement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete agreement
// @route   DELETE /api/agreements/:id
// @access  Private
exports.deleteAgreement = async (req, res) => {
  try {
    const agreement = await Agreement.findById(req.params.id);

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: 'Agreement not found'
      });
    }

    await agreement.remove();

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

// @desc    Get agreements by client
// @route   GET /api/clients/:clientId/agreements
// @access  Private
exports.getClientAgreements = async (req, res) => {
  try {
    const client = await Client.findById(req.params.clientId);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const agreements = await Agreement.find({ client: req.params.clientId })
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: agreements.length,
      data: agreements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

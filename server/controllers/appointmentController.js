const Appointment = require('../models/Appointment');
const Client = require('../models/Client');

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
exports.getAppointments = async (req, res) => {
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
    
    // Filter by appointment type if provided
    if (req.query.appointmentType) {
      query.appointmentType = req.query.appointmentType;
    }
    
    // Filter by assigned user if provided
    if (req.query.assignedTo) {
      query.assignedTo = req.query.assignedTo;
    }

    // Filter by date range if provided
    if (req.query.startDate && req.query.endDate) {
      query.scheduledFor = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    } else if (req.query.startDate) {
      query.scheduledFor = { $gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      query.scheduledFor = { $lte: new Date(req.query.endDate) };
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await Appointment.countDocuments(query);
    
    // Execute query with pagination and populate relations
    const appointments = await Appointment.find(query)
      .populate('client', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName')
      .sort({ scheduledFor: 1 })
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: appointments.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      },
      data: appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
exports.getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('client', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Private
exports.createAppointment = async (req, res) => {
  try {
    // Check if client exists
    const client = await Client.findById(req.body.client);
    if (!client) {
      return res.status(400).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      ...req.body,
      assignedTo: req.body.assignedTo || req.user.id
    });

    // Populate relations
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('client', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName');

    res.status(201).json({
      success: true,
      data: populatedAppointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
exports.updateAppointment = async (req, res) => {
  try {
    let appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Update appointment
    appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    )
      .populate('client', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private
exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    await appointment.remove();

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

// @desc    Get appointments by client
// @route   GET /api/clients/:clientId/appointments
// @access  Private
exports.getClientAppointments = async (req, res) => {
  try {
    const client = await Client.findById(req.params.clientId);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const appointments = await Appointment.find({ client: req.params.clientId })
      .populate('assignedTo', 'firstName lastName')
      .sort({ scheduledFor: 1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get upcoming appointments
// @route   GET /api/appointments/upcoming
// @access  Private
exports.getUpcomingAppointments = async (req, res) => {
  try {
    const now = new Date();
    // Get appointments in the next 7 days by default
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + (parseInt(req.query.days) || 7));
    
    const appointments = await Appointment.find({
      scheduledFor: { $gte: now, $lte: endDate },
      status: { $nin: ['Cancelled', 'Completed'] }
    })
      .populate('client', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName')
      .sort({ scheduledFor: 1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

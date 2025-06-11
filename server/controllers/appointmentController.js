import Appointment from '../models/Appointment.js';
import Client from '../models/Client.js';
import VisaTracker from '../models/VisaTracker.js';

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
export const getAppointments = async (req, res) => {
  try {
    // Build query based on filter parameters
    const query = {};
    
    // Filter by client if provided
    if (req.query.client) {
      query.clientId = req.query.client;
    }
    
    // Filter by status if provided
    if (req.query.status) {
      query['appointment.status'] = req.query.status;
    }
    
    // Filter by appointment type if provided
    if (req.query.appointmentType) {
      query['appointment.type'] = req.query.appointmentType;
    }

    // Filter by date range if provided
    if (req.query.startDate && req.query.endDate) {
      query['appointment.dateTime'] = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    } else if (req.query.startDate) {
      query['appointment.dateTime'] = { $gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      query['appointment.dateTime'] = { $lte: new Date(req.query.endDate) };
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await VisaTracker.countDocuments(query);
    
    // Execute query with pagination and populate relations
    const visaTrackers = await VisaTracker.find(query)
      .populate('clientId', 'firstName lastName email')
      .sort({ 'appointment.dateTime': 1 })
      .skip(startIndex)
      .limit(limit);

    // Transform the data to match the expected format
    const appointments = visaTrackers.map(tracker => ({
      _id: tracker._id,
      client: tracker.clientId,
      clientName: `${tracker.clientId?.firstName || ''} ${tracker.clientId?.lastName || ''}`.trim(),
      clientEmail: tracker.clientId?.email,
      appointmentType: tracker.appointment.type,
      type: tracker.appointment.type,
      dateTime: tracker.appointment.dateTime,
      scheduledFor: tracker.appointment.dateTime,
      location: tracker.appointment.embassy,
      embassy: tracker.appointment.embassy,
      status: tracker.appointment.status,
      notes: tracker.appointment.notes,
      confirmationNumber: tracker.appointment.confirmationNumber,
      confirmation: tracker.appointment.confirmationNumber,
      completed: tracker.appointment.completed,
      createdAt: tracker.createdAt,
      updatedAt: tracker.updatedAt
    }));

    res.status(200).json({
      success: true,
      data: appointments,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    console.error('Error in getAppointments:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
export const getAppointment = async (req, res) => {
  try {
    const visaTracker = await VisaTracker.findById(req.params.id)
      .populate('clientId', 'firstName lastName email');

    if (!visaTracker || !visaTracker.appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Transform the data to match the expected format
    const appointment = {
      _id: visaTracker._id,
      client: visaTracker.clientId,
      appointmentType: visaTracker.appointment.type,
      scheduledFor: visaTracker.appointment.dateTime,
      location: visaTracker.appointment.embassy,
      status: visaTracker.appointment.status,
      notes: visaTracker.appointment.notes,
      confirmationNumber: visaTracker.appointment.confirmationNumber,
      completed: visaTracker.appointment.completed,
      createdAt: visaTracker.createdAt,
      updatedAt: visaTracker.updatedAt
    };

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
export const createAppointment = async (req, res) => {
  try {
    // Check if client exists
    const client = await Client.findById(req.body.client);
    if (!client) {
      return res.status(400).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Create or update visa tracker with appointment
    const visaTracker = await VisaTracker.findOneAndUpdate(
      { clientId: req.body.client },
      {
        $set: {
          appointment: {
            type: req.body.appointmentType,
            dateTime: req.body.scheduledFor,
            embassy: req.body.location,
            status: 'SCHEDULED',
            notes: req.body.notes,
            confirmationNumber: req.body.confirmationNumber,
            completed: false
          }
        }
      },
      { new: true, upsert: true }
    ).populate('clientId', 'firstName lastName email');

    // Transform the data to match the expected format
    const appointment = {
      _id: visaTracker._id,
      client: visaTracker.clientId,
      appointmentType: visaTracker.appointment.type,
      scheduledFor: visaTracker.appointment.dateTime,
      location: visaTracker.appointment.embassy,
      status: visaTracker.appointment.status,
      notes: visaTracker.appointment.notes,
      confirmationNumber: visaTracker.appointment.confirmationNumber,
      completed: visaTracker.appointment.completed,
      createdAt: visaTracker.createdAt,
      updatedAt: visaTracker.updatedAt
    };

    res.status(201).json({
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

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
export const updateAppointment = async (req, res) => {
  try {
    const visaTracker = await VisaTracker.findById(req.params.id);

    if (!visaTracker || !visaTracker.appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Update appointment
    const updatedTracker = await VisaTracker.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          'appointment.type': req.body.appointmentType,
          'appointment.dateTime': req.body.scheduledFor,
          'appointment.embassy': req.body.location,
          'appointment.status': req.body.status,
          'appointment.notes': req.body.notes,
          'appointment.confirmationNumber': req.body.confirmationNumber,
          'appointment.completed': req.body.completed,
          updatedAt: Date.now()
        }
      },
      { new: true, runValidators: true }
    ).populate('clientId', 'firstName lastName email');

    // Transform the data to match the expected format
    const appointment = {
      _id: updatedTracker._id,
      client: updatedTracker.clientId,
      appointmentType: updatedTracker.appointment.type,
      scheduledFor: updatedTracker.appointment.dateTime,
      location: updatedTracker.appointment.embassy,
      status: updatedTracker.appointment.status,
      notes: updatedTracker.appointment.notes,
      confirmationNumber: updatedTracker.appointment.confirmationNumber,
      completed: updatedTracker.appointment.completed,
      createdAt: updatedTracker.createdAt,
      updatedAt: updatedTracker.updatedAt
    };

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
export const deleteAppointment = async (req, res) => {
  try {
    const visaTracker = await VisaTracker.findById(req.params.id);

    if (!visaTracker || !visaTracker.appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Remove appointment data
    await VisaTracker.findByIdAndUpdate(
      req.params.id,
      {
        $unset: { appointment: 1 },
        $set: { updatedAt: Date.now() }
      }
    );

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
export const getClientAppointments = async (req, res) => {
  try {
    const client = await Client.findById(req.params.clientId);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const visaTracker = await VisaTracker.findOne({ clientId: req.params.clientId })
      .populate('clientId', 'firstName lastName email');

    if (!visaTracker || !visaTracker.appointment) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    // Transform the data to match the expected format
    const appointment = {
      _id: visaTracker._id,
      client: visaTracker.clientId,
      appointmentType: visaTracker.appointment.type,
      scheduledFor: visaTracker.appointment.dateTime,
      location: visaTracker.appointment.embassy,
      status: visaTracker.appointment.status,
      notes: visaTracker.appointment.notes,
      confirmationNumber: visaTracker.appointment.confirmationNumber,
      completed: visaTracker.appointment.completed,
      createdAt: visaTracker.createdAt,
      updatedAt: visaTracker.updatedAt
    };

    res.status(200).json({
      success: true,
      count: 1,
      data: [appointment]
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
export const getUpcomingAppointments = async (req, res) => {
  try {
    const now = new Date();
    // Get appointments in the next 7 days by default
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + (parseInt(req.query.days) || 7));
    
    const visaTrackers = await VisaTracker.find({
      'appointment.dateTime': { $gte: now, $lte: endDate },
      'appointment.status': { $nin: ['Cancelled', 'Completed'] }
    })
      .populate('clientId', 'firstName lastName email')
      .sort({ 'appointment.dateTime': 1 });

    // Transform the data to match the expected format
    const appointments = visaTrackers.map(tracker => ({
      _id: tracker._id,
      client: tracker.clientId,
      appointmentType: tracker.appointment.type,
      scheduledFor: tracker.appointment.dateTime,
      location: tracker.appointment.embassy,
      status: tracker.appointment.status,
      notes: tracker.appointment.notes,
      confirmationNumber: tracker.appointment.confirmationNumber,
      completed: tracker.appointment.completed,
      createdAt: tracker.createdAt,
      updatedAt: tracker.updatedAt
    }));

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

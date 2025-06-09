import Appointment from '../models/Appointment.js';
import Client from '../models/Client.js';
import Branch from '../models/Branch.js';
import mongoose from 'mongoose';

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
export const getAppointments = async (req, res) => {
  try {
    // Build query based on filter parameters
    const query = {};
    
    // Filter by branch if provided and not 'all'
    if (req.query.branchId && req.query.branchId !== 'all') {
      console.log('Filtering by branchId:', req.query.branchId);
      try {
        // First find the branch by its custom branchId
        const branch = await Branch.findOne({ branchId: req.query.branchId });
        if (!branch) {
          console.log('Branch not found for branchId:', req.query.branchId);
          return res.status(404).json({
            success: false,
            message: 'Branch not found'
          });
        }

        console.log('Found branch:', branch);

        // Then find all clients in this branch using the branch's _id
        const clients = await Client.find({ branchId: branch._id });
        console.log('Found clients for branch:', clients.length);
        
        if (clients.length === 0) {
          console.log('No clients found for branch');
          return res.status(200).json({
            success: true,
            count: 0,
            pagination: {
              total: 0,
              page: parseInt(req.query.page, 10) || 1,
              pages: 0,
              limit: parseInt(req.query.limit, 10) || 10
            },
            data: []
          });
        }

        const clientIds = clients.map(client => client._id);
        query.client = { $in: clientIds };
      } catch (error) {
        console.error('Error finding clients for branch:', error);
        return res.status(400).json({
          success: false,
          message: 'Error finding clients for the selected branch'
        });
      }
    } else {
      console.log('No branch filter applied - showing all appointments');
    }
    
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

    console.log('Final query:', JSON.stringify(query, null, 2));

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await Appointment.countDocuments(query);
    console.log('Total appointments found:', total);
    
    // Execute query with pagination and populate relations
    const appointments = await Appointment.find(query)
      .populate({
        path: 'client',
        select: 'firstName lastName email branchId',
        populate: {
          path: 'branchId',
          select: 'branchName branchLocation branchId'
        }
      })
      .populate('assignedTo', 'firstName lastName')
      .sort({ scheduledFor: 1 })
      .skip(startIndex)
      .limit(limit);

    console.log('Appointments found:', appointments.length);

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
    console.error('Error in getAppointments:', error);
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

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
export const getAppointment = async (req, res) => {
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
export const createAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.create(req.body);
    
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
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

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

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private
export const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

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

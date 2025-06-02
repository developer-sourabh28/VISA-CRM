import Client from '../models/client.js';
import Appointment from '../models/Appointment.js';
import Payment from '../models/Payment.js';
import Task from '../models/Task.js';
import Enquiry from '../models/Enquiry.js';
import VisaTracker from '../models/VisaTracker.js';

export const getRecentActivities = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999); // End of today

    // Fetch today's activities
    const newClients = await Client.find({
      createdAt: { $gte: today, $lte: endOfToday }
    }).select("_id firstName lastName email createdAt").sort({ createdAt: -1 });

    const convertedEnquiries = await Enquiry.find({
  $or: [
    { createdAt: { $gte: today, $lte: endOfToday } },
    { convertedAt: { $gte: today, $lte: endOfToday } }
  ]
}).select("_id firstName lastName email createdAt convertedAt").sort({ createdAt: -1 });


    const newAppointments = await Appointment.find({
      createdAt: { $gte: today, $lte: endOfToday }
    }).populate('client', 'firstName lastName email').select("_id scheduledFor status createdAt").sort({ createdAt: -1 });

    const recentPayments = await Payment.find({
      createdAt: { $gte: today, $lte: endOfToday }
    }).populate('client', 'firstName lastName').select("_id amount status createdAt").sort({ createdAt: -1 });

    const completedTasks = await Task.find({
      completedAt: { $gte: today, $lte: endOfToday }
    }).select("_id title description completedAt").sort({ completedAt: -1 });

    // Transform data into unified activity format
    const activities = [];

    // Add new clients
    newClients.forEach(client => {
      activities.push({
        type: 'new-client',
        message: `New client ${client.firstName} ${client.lastName} registered`,
        createdAt: client.createdAt,
        icon: 'user-plus',
        data: client
      });
    });

    // Add new enquiries
    
    convertedEnquiries.forEach(enquiry => {
      if (enquiry.convertedAt && enquiry.convertedAt >= today) {
        activities.push({
          type: 'enquiry-converted',
          message: `Enquiry from ${enquiry.firstName} ${enquiry.lastName} converted to client`,
          createdAt: enquiry.convertedAt,
          icon: 'user-check',
          data: enquiry
        });
      } else {
        activities.push({
          type: 'new-enquiry',
          message: `New enquiry received from ${enquiry.firstName} ${enquiry.lastName}`,
          createdAt: enquiry.createdAt,
          icon: 'mail',
          data: enquiry
        });
      }
    });

    // Add new appointments
    newAppointments.forEach(appointment => {
      const clientName = appointment.client ? 
        `${appointment.client.firstName} ${appointment.client.lastName}` : 
        'Unknown Client';
      
      activities.push({
        type: 'new-appointment',
        message: `New appointment scheduled for ${clientName}`,
        createdAt: appointment.createdAt,
        icon: 'calendar-plus',
        data: appointment
      });
    });

    // Add payments
    recentPayments.forEach(payment => {
      const clientName = payment.client ? 
        `${payment.client.firstName} ${payment.client.lastName}` : 
        'Unknown Client';
      
      activities.push({
        type: 'payment-received',
        message: `Payment of $${payment.amount} received from ${clientName}`,
        createdAt: payment.createdAt,
        icon: 'dollar-sign',
        data: payment
      });
    });

    // Add completed tasks
    completedTasks.forEach(task => {
      activities.push({
        type: 'task-completed',
        message: `Task "${task.title}" completed`,
        createdAt: task.completedAt,
        icon: 'check-circle',
        data: task
      });
    });

    // Sort all activities by creation time (newest first)
    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Limit to latest 10 activities
    const limitedActivities = activities.slice(0, 10);

    res.status(200).json({
      success: true,
      data: limitedActivities,
      meta: {
        total: activities.length,
        displayed: limitedActivities.length,
        date: today.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error("Error in getRecentActivities:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const totalClients = await Client.countDocuments();
    const totalAppointments = await VisaTracker.countDocuments({ 'appointment': { $exists: true } });
    const totalPayments = await Payment.countDocuments();
    const totalTasks = await Task.countDocuments();

    // Additional stats for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayClients = await Client.countDocuments({
      createdAt: { $gte: today, $lte: endOfToday }
    });

    const todayAppointments = await VisaTracker.countDocuments({
      'appointment': { $exists: true },
      'clientId': { $exists: true },
      'appointment.status': { $exists: true },
      'appointment.dateTime': { 
        $gte: today, 
        $lte: endOfToday 
      }
    });

    const todayPayments = await Payment.countDocuments({
      createdAt: { $gte: today, $lte: endOfToday }
    });

    res.status(200).json({
      success: true,
      data: {
        totalClients,
        totalAppointments,
        totalPayments,
        totalTasks,
        todayStats: {
          newClients: todayClients,
          newAppointments: todayAppointments,
          paymentsReceived: todayPayments
        }
      }
    });
  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getApplicationStatusChart = async (req, res) => {
  try {
    const statusCounts = await VisaTracker.aggregate([
      {
        $match: { 'appointment': { $exists: true } }
      },
      {
        $group: {
          _id: "$appointment.status",
          count: { $sum: 1 }
        }
      }
    ]);

    const chartData = statusCounts.map(status => ({
      status: status._id || 'NOT_SCHEDULED',
      count: status.count
    }));

    res.status(200).json({
      success: true,
      data: chartData
    });
  } catch (error) {
    console.error("Error in getApplicationStatusChart:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMonthlyApplicationsChart = async (req, res) => {
  try {
    const monthlyData = await VisaTracker.aggregate([
      {
        $match: { 
          'appointment': { $exists: true },
          'appointment.dateTime': { $exists: true }
        }
      },
      {
        $group: {
          _id: { $month: "$appointment.dateTime" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const chartData = monthlyData.map(month => ({
      month: month._id,
      count: month.count
    }));

    res.status(200).json({
      success: true,
      data: chartData
    });
  } catch (error) {
    console.error("Error in getMonthlyApplicationsChart:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRecentApplications = async (req, res) => {
  try {
    const recentApplications = await VisaTracker.find({
      'appointment': { $exists: true }
    })
      .sort({ 'appointment.dateTime': -1 })
      .limit(5)
      .populate('clientId', 'firstName lastName email')
      .select("_id appointment clientId");

    const formattedApplications = recentApplications.map(app => ({
      _id: app._id,
      scheduledFor: app.appointment.dateTime,
      status: app.appointment.status,
      client: app.clientId
    }));

    res.status(200).json({
      success: true,
      data: formattedApplications
    });
  } catch (error) {
    console.error("Error in getRecentApplications:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUpcomingDeadlines = async (req, res) => {
  try {
    const today = new Date();
    const upcomingDeadlines = await VisaTracker.find({
      'appointment': { $exists: true },
      'appointment.dateTime': { $gte: today }
    })
      .sort({ 'appointment.dateTime': 1 })
      .limit(5)
      .populate('clientId', 'firstName lastName email')
      .select("_id appointment clientId");

    const formattedDeadlines = upcomingDeadlines.map(app => ({
      _id: app._id,
      scheduledFor: app.appointment.dateTime,
      status: app.appointment.status,
      client: app.clientId
    }));

    res.status(200).json({
      success: true,
      data: formattedDeadlines
    });
  } catch (error) {
    console.error("Error in getUpcomingDeadlines:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
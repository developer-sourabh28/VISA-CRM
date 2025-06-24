import Client from '../models/Client.js';
import Appointment from '../models/Appointment.js';
import Payment from '../models/Payment.js';
import Task from '../models/Task.js';
import Enquiry from '../models/Enquiry.js';
import VisaTracker from '../models/VisaTracker.js';
import Reminder from '../models/Reminder.js';
import Branch from '../models/Branch.js';

export const getRecentActivities = async (req, res) => {
  try {
    const { branch, month, year } = req.query;
    let branchFilter = {};
    if (branch) {
      const branchDoc = await Branch.findOne({ branchName: branch });
      if (branchDoc) {
        branchFilter = { branchId: branchDoc._id };
      }
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const dateFilter = { createdAt: { $gte: startDate, $lte: endDate } };

    const newClients = await Client.find({ ...dateFilter, ...branchFilter })
      .select("_id firstName lastName email createdAt")
      .sort({ createdAt: -1 });

    const convertedEnquiries = await Enquiry.find({
      $or: [
        { createdAt: { $gte: startDate, $lte: endDate } },
        { convertedAt: { $gte: startDate, $lte: endDate } }
      ],
      ...branchFilter
    }).select("_id firstName lastName email createdAt convertedAt").sort({ createdAt: -1 });

    const newAppointments = await Appointment.find({ ...dateFilter, ...branchFilter })
      .populate('client', 'firstName lastName email')
      .select("_id scheduledFor status createdAt")
      .sort({ createdAt: -1 });

    const recentPayments = await Payment.find({ ...dateFilter, ...branchFilter })
      .populate('clientId', 'firstName lastName')
      .select("_id amount status createdAt")
      .sort({ createdAt: -1 });

    const completedTasks = await Task.find({ 
      completedAt: { $gte: startDate, $lte: endDate }, 
      ...branchFilter 
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
      if (enquiry.convertedAt && enquiry.convertedAt >= startDate) {
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
      const clientName = payment.clientId ? 
        `${payment.clientId.firstName} ${payment.clientId.lastName}` : 
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

    // Get upcoming payment due dates
    const upcomingPayments = await Payment.find({
      dueDate: { $gte: new Date() },
      status: { $ne: 'Completed' },
      ...branchFilter
    })
    .populate('clientId', 'firstName lastName email')
    .sort({ dueDate: 1 })
    .limit(5);

    // Get overdue payments
    const overduePayments = await Payment.find({
      dueDate: { $lt: new Date() },
      status: { $ne: 'Completed' },
      ...branchFilter
    })
    .populate('clientId', 'firstName lastName email')
    .sort({ dueDate: 1 });

    // Add payment reminders to activities
    upcomingPayments.forEach(payment => {
      const daysUntilDue = Math.ceil((payment.dueDate - new Date()) / (1000 * 60 * 60 * 24));
      activities.push({
        type: 'payment-due',
        message: `Payment of $${payment.amount} due from ${payment.clientId.firstName} ${payment.clientId.lastName} in ${daysUntilDue} days`,
        createdAt: payment.dueDate,
        icon: 'dollar-sign',
        data: payment
      });
    });

    overduePayments.forEach(payment => {
      const daysOverdue = Math.ceil((new Date() - payment.dueDate) / (1000 * 60 * 60 * 24));
      activities.push({
        type: 'payment-overdue',
        message: `Payment of $${payment.amount} from ${payment.clientId.firstName} ${payment.clientId.lastName} is overdue by ${daysOverdue} days`,
        createdAt: payment.dueDate,
        icon: 'alert-circle',
        data: payment
      });
    });

    // Sort activities by date
    activities.sort((a, b) => {
      // Make sure createdAt is a valid date
      const dateA = a.createdAt instanceof Date && !isNaN(a.createdAt) ? a.createdAt : new Date();
      const dateB = b.createdAt instanceof Date && !isNaN(b.createdAt) ? b.createdAt : new Date();
      return dateB - dateA;
    });

    // Limit to latest 10 activities
    const limitedActivities = activities.slice(0, 10);

    res.status(200).json({
      success: true,
      data: limitedActivities,
      meta: {
        total: activities.length,
        displayed: limitedActivities.length,
        date: new Date().toISOString().split('T')[0],
        branch
      },
      upcomingPayments,
      overduePayments
    });
  } catch (error) {
    console.error("Error in getRecentActivities:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const { branch, month, year } = req.query;
    
    let branchFilter = {};
    if (branch) {
      const branchDoc = await Branch.findOne({ branchName: branch });
      if (branchDoc) {
        branchFilter = { branchId: branchDoc._id };
      }
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    const dateFilter = { createdAt: { $gte: startDate, $lte: endDate } };

    const totalClients = await Client.countDocuments({ ...branchFilter, ...dateFilter });
    const totalAppointments = await VisaTracker.countDocuments({ 
      'appointment.dateTime': { $gte: startDate, $lte: endDate },
      ...branchFilter 
    });
    const totalPayments = await Payment.countDocuments({ ...branchFilter, ...dateFilter });
    const totalTasks = await Task.countDocuments({ ...branchFilter, ...dateFilter });
    const totalReminders = await Reminder.countDocuments({ ...branchFilter, ...dateFilter });

    // Today's stats are not affected by the filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayClients = await Client.countDocuments({
      createdAt: { $gte: today, $lte: endOfToday },
      ...branchFilter
    });
    const todayAppointments = await VisaTracker.countDocuments({
      'appointment.dateTime': { $gte: today, $lte: endOfToday },
      ...branchFilter
    });
    const todayPayments = await Payment.countDocuments({
      createdAt: { $gte: today, $lte: endOfToday },
      ...branchFilter
    });
    const todayReminders = await Reminder.countDocuments({
      createdAt: { $gte: today, $lte: endOfToday },
      ...branchFilter
    });

    res.status(200).json({
      success: true,
      data: {
        totalClients,
        totalAppointments,
        totalPayments,
        totalTasks,
        totalReminders,
        todayStats: {
          newClients: todayClients,
          newAppointments: todayAppointments,
          paymentsReceived: todayPayments,
          reminders: todayReminders
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
    const { month, year, branch } = req.query;

    let branchFilter = {};
    if (branch) {
      const branchDoc = await Branch.findOne({ branchName: branch });
      if (branchDoc) {
        branchFilter = { branchId: branchDoc._id };
      }
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const statusCounts = await VisaTracker.aggregate([
      {
        $match: {
          'appointment.dateTime': { $gte: startDate, $lte: endDate },
          ...branchFilter
        }
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
    const { month, year, branch } = req.query;
    const currentDate = new Date();
    const selectedYear = parseInt(year) || currentDate.getFullYear();
    const selectedMonth = parseInt(month) || currentDate.getMonth() + 1;
    
    // Get branch ID
    let branchFilter = {};
    if (branch) {
      const branchDoc = await Branch.findOne({ name: branch });
      if (branchDoc) {
        branchFilter = { branchId: branchDoc._id };
      }
    }

    // Create date range for the selected month
    const startDate = new Date(selectedYear, selectedMonth - 1, 1);
    const endDate = new Date(selectedYear, selectedMonth, 0);

    const dailyData = await VisaTracker.aggregate([
      {
        $match: {
          'appointment.dateTime': {
            $gte: startDate,
            $lte: endDate
          },
          ...branchFilter
        }
      },
      {
        $group: {
          _id: { $dayOfMonth: '$appointment.dateTime' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Create an array for all days in the month
    const daysInMonth = endDate.getDate();
    const chartData = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      count: 0
    }));

    // Fill in the actual data
    dailyData.forEach(data => {
      chartData[data._id - 1].count = data.count;
    });

    res.status(200).json({
      success: true,
      data: chartData,
      meta: {
        month: selectedMonth,
        year: selectedYear,
        branch
      }
    });
  } catch (error) {
    console.error("Error in getMonthlyApplicationsChart:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRecentApplications = async (req, res) => {
  try {
    const { branch, month, year } = req.query;
    let branchFilter = {};
    if (branch) {
      const branchDoc = await Branch.findOne({ branchName: branch });
      if (branchDoc) {
        branchFilter = { branchId: branchDoc._id };
      }
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const recentApplications = await VisaTracker.find({
      'appointment.dateTime': { $gte: startDate, $lte: endDate },
      ...branchFilter
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
    const { branch, month, year } = req.query;
    let branchFilter = {};
    if (branch) {
      const branchDoc = await Branch.findOne({ branchName: branch });
      if (branchDoc) {
        branchFilter = { branchId: branchDoc._id };
      }
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const upcomingDeadlines = await VisaTracker.find({
      'appointment.dateTime': { $gte: startDate, $lte: endDate },
      ...branchFilter
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

export const getReportStats = async (req, res) => {
  try {
    const { branch, month, year } = req.query;

    let branchFilter = {};
    if (branch) {
      const branchDoc = await Branch.findOne({ branchName: branch });
      if (branchDoc) {
        branchFilter = { branchId: branchDoc._id };
      }
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    const dateFilter = { createdAt: { $gte: startDate, $lte: endDate } };

    const totalClients = await Client.countDocuments({ ...branchFilter, ...dateFilter });
    const totalEnquiries = await Enquiry.countDocuments({ ...branchFilter, ...dateFilter });
    
    const payments = await Payment.find({ ...branchFilter, ...dateFilter });
    const totalRevenue = payments.reduce((acc, payment) => 
      payment.status === 'Completed' ? acc + payment.amount : acc, 0
    );
    const totalPaymentsDue = payments.reduce((acc, payment) => 
      payment.status === 'Pending' ? acc + payment.amount : acc, 0
    );

    const clientGrowth = await getClientGrowthData(branchFilter, year, month);
    const enquiriesData = await getEnquiriesData(branchFilter, year, month);
    
    const paymentsData = [
      { name: "Payments Done", value: totalRevenue },
      { name: "Payments Due", value: totalPaymentsDue }
    ];

    const recentPayments = await getRecentPayments(branchFilter, dateFilter);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalClients,
          totalEnquiries,
          totalRevenue,
          totalPaymentsDue
        },
        clientGrowth,
        enquiriesData,
        paymentsData,
        recentPayments
      }
    });
  } catch (error) {
    console.error("Error in getReportStats:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getClientGrowthData = async (branchFilter, year, month) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const data = [];

  for (let i = 0; i < 12; i++) {
    const startDate = new Date(year, i, 1);
    const endDate = new Date(year, i + 1, 0);
    
    const count = await Client.countDocuments({
      ...branchFilter,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    data.push({
      month: months[i],
      clients: count
    });
  }

  return data;
};

const getEnquiriesData = async (branchFilter, year, month) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const data = [];

  for (let i = 0; i < 12; i++) {
    const startDate = new Date(year, i, 1);
    const endDate = new Date(year, i + 1, 0);
    
    const count = await Enquiry.countDocuments({
      ...branchFilter,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    data.push({
      month: months[i],
      enquiries: count
    });
  }

  return data;
};

const getRecentPayments = async (branchFilter, dateFilter) => {
  const payments = await Payment.find({ ...branchFilter, ...dateFilter })
    .populate('clientId', 'name email')
    .sort({ date: -1 })
    .limit(10);

  return payments.map(payment => ({
    name: payment.clientId?.name || 'Unknown Client',
    email: payment.clientId?.email || 'N/A',
    enquiryDate: payment.date.toISOString().split('T')[0],
    status: payment.status === 'Completed' ? 'Paid' : 'Due',
    amount: payment.amount
  }));
};
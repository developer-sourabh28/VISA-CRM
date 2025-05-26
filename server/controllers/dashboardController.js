import Client from '../models/Client.js';
// import Document from '../models/Document.js';
// import Appointment from '../models/Appointment.js';
import Payment from '../models/Payment.js';
import Task from '../models/Task.js';
// import { applicationStatus } from '../../shared/schema';
// import Client from '../models/Client.js';

// @desc    Get dashboard summary stats
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res) => {
  try {
    // Get total clients count
    const totalClients = await Client.countDocuments();
    
    // Get approved visa applications count
    const approvedVisas = 23; // Mock data as we don't have a separate visa model yet
    
    // Get pending applications count
    const pendingApplications = 15; // Mock data as we don't have a separate visa model yet
    
    // Get monthly revenue
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const payments = await Payment.find({
      paymentDate: { $gte: currentMonth, $lt: nextMonth },
      status: 'Paid'
    });
    
    const monthlyRevenue = payments.reduce((total, payment) => total + payment.amount, 0);

    res.json({
      success: true,
      data: {
        totalClients,
        approvedVisas,
        pendingApplications,
        monthlyRevenue
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get application status chart data
// @route   GET /api/dashboard/charts/application-status
// @access  Private
export const getApplicationStatusChart = async (req, res) => {
  try {
    // In a real system, this would be based on an Applications model
    // Since we don't have one yet, returning mock data that follows the schema
    
    const chartData = [
      { status: 'Approved', count: 50, percentage: 50 },
      { status: 'In Progress', count: 30, percentage: 30 },
      { status: 'Rejected', count: 20, percentage: 20 }
    ];
    
    res.status(200).json({
      success: true,
      data: chartData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get monthly applications chart data
// @route   GET /api/dashboard/charts/monthly-applications
// @access  Private
export const getMonthlyApplicationsChart = async (req, res) => {
  try {
    // Mock data for monthly applications chart
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    
    const totalApplications = [12, 15, 18, 24, 20, 25];
    const approvedApplications = [8, 10, 12, 16, 14, 18];
    
    const chartData = {
      labels: months,
      datasets: [
        {
          label: 'Total Applications',
          data: totalApplications
        },
        {
          label: 'Approved Applications',
          data: approvedApplications
        }
      ]
    };
    
    res.status(200).json({
      success: true,
      data: chartData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get recent applications
// @route   GET /api/dashboard/recent-applications
// @access  Private
export const getRecentApplications = async (req, res) => {
  try {
    // In a real system, this would fetch from an Applications model
    // For now, create mock data for the UI with realistic client IDs
    
    // Get some real client IDs to make this realistic
    const clients = await Client.find()
      .limit(5)
      .select('_id firstName lastName email');
      
    // Create mock application data with real client IDs
    const recentApplications = [
      {
        id: '1',
        client: clients[0] || { _id: '1', firstName: 'David', lastName: 'Wilson', email: 'david.wilson@example.com' },
        visaType: 'Schengen Tourist Visa',
        destination: 'France',
        submissionDate: '2023-06-15',
        status: 'Approved',
        executive: 'Jane Smith'
      },
      {
        id: '2',
        client: clients[1] || { _id: '2', firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.johnson@example.com' },
        visaType: 'Student Visa',
        destination: 'United Kingdom',
        submissionDate: '2023-06-02',
        status: 'In Progress',
        executive: 'Bob Wilson'
      },
      {
        id: '3',
        client: clients[2] || { _id: '3', firstName: 'Michael', lastName: 'Lee', email: 'michael.lee@example.com' },
        visaType: 'Work Visa',
        destination: 'Australia',
        submissionDate: '2023-05-28',
        status: 'Rejected',
        executive: 'Emma Davis'
      },
      {
        id: '4',
        client: clients[3] || { _id: '4', firstName: 'Linda', lastName: 'Chen', email: 'linda.chen@example.com' },
        visaType: 'Business Visa',
        destination: 'United States',
        submissionDate: '2023-05-25',
        status: 'Approved',
        executive: 'John Doe'
      },
      {
        id: '5',
        client: clients[4] || { _id: '5', firstName: 'Emily', lastName: 'Harris', email: 'emily.harris@example.com' },
        visaType: 'Tourist Visa',
        destination: 'Japan',
        submissionDate: '2023-05-20',
        status: 'In Progress',
        executive: 'Alice Brown'
      }
    ];
    
    res.status(200).json({
      success: true,
      count: recentApplications.length,
      data: recentApplications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get upcoming deadlines
// @route   GET /api/dashboard/upcoming-deadlines
// @access  Private
export const getUpcomingDeadlines = async (req, res) => {
  try {
    // Get upcoming tasks/deadlines
    const now = new Date();
    const twoWeeksFromNow = new Date(now);
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
    
    const tasks = await Task.find({
      dueDate: { $gte: now, $lte: twoWeeksFromNow },
      status: { $nin: ['Completed', 'Cancelled'] }
    })
      .populate('client', 'firstName lastName')
      .populate('assignedTo', 'firstName lastName')
      .sort({ dueDate: 1 })
      .limit(5);
    
    const deadlines = tasks.map(task => {
      // Calculate days left
      const dueDate = new Date(task.dueDate);
      const timeDiff = dueDate.getTime() - now.getTime();
      const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      return {
        id: task._id,
        title: task.title,
        client: task.client ? `${task.client.firstName} ${task.client.lastName}` : 'N/A',
        dueDate: task.dueDate,
        daysLeft,
        status: task.status,
        progress: task.progress,
        priority: task.priority
      };
    });
    
    res.status(200).json({
      success: true,
      count: deadlines.length,
      data: deadlines
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

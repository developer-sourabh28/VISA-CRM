import Enquiry from '../models/Enquiry.js';
import Payment from '../models/Payment.js';
import Reminder from '../models/Reminder.js';

// @desc    Get all notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    // Get recent Facebook leads (enquiries)
    const recentEnquiries = await Enquiry.find({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    }).sort({ createdAt: -1 }).limit(10);

    // Get payment reminders due today or overdue
    const paymentReminders = await Payment.find({
      dueDate: { $lte: today },
      status: { $ne: 'Completed' }
    }).populate('clientId', 'firstName lastName email').sort({ dueDate: 1 });

    // Get other reminders
    const otherReminders = await Reminder.find({
      reminderDate: { $lte: today },
      status: 'PENDING'
    }).sort({ reminderDate: 1 }).limit(10);

    // Format notifications
    const notifications = [
      // Format Facebook leads
      ...recentEnquiries.map(enquiry => ({
        id: enquiry._id,
        type: 'facebook-lead',
        title: 'New Facebook Lead',
        message: `New lead received from ${enquiry.firstName} ${enquiry.lastName}`,
        timestamp: enquiry.createdAt,
        data: {
          enquiryId: enquiry._id,
          name: `${enquiry.firstName} ${enquiry.lastName}`,
          email: enquiry.email
        }
      })),
      
      // Format payment reminders
      ...paymentReminders.map(payment => {
        const clientName = payment.clientId ? 
          `${payment.clientId.firstName} ${payment.clientId.lastName}` : 
          'Unknown Client';
          
        return {
          id: payment._id,
          type: 'payment-reminder',
          title: 'Payment Reminder',
          message: `Installment due for ${clientName} – ₹${payment.amount}`,
          timestamp: payment.dueDate,
          data: {
            paymentId: payment._id,
            clientId: payment.clientId?._id,
            amount: payment.amount
          }
        };
      }),
      
      // Format other reminders
      ...otherReminders.map(reminder => ({
        id: reminder._id,
        type: 'reminder',
        title: reminder.title,
        message: reminder.description,
        timestamp: reminder.reminderDate,
        data: {
          reminderId: reminder._id,
          priority: reminder.priority
        }
      }))
    ];

    // Sort by timestamp (newest first)
    notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;
    
    // In a real implementation, you would update a user's notification read status
    // For now, we'll just return success
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}; 
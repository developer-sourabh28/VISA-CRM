import mongoose from 'mongoose';
import Payment from '../models/Payment.js';
import Reminder from '../models/Reminder.js';
import dotenv from 'dotenv';

dotenv.config();

const createRemindersForExistingPayments = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all payments with due dates
    const payments = await Payment.find({
      dueDate: { $exists: true },
      status: { $ne: 'Completed' }
    }).populate('clientId');

    console.log(`Found ${payments.length} payments with due dates`);

    // Create reminders for each payment
    for (const payment of payments) {
      // Check if reminder already exists
      const existingReminder = await Reminder.findOne({
        client: payment.clientId._id,
        title: { $regex: `Payment Due: ${payment.amount}` }
      });

      if (!existingReminder) {
        const reminder = new Reminder({
          title: `Payment Due: ${payment.amount} ${payment.currency}`,
          description: `Payment of ${payment.amount} ${payment.currency} for ${payment.serviceType} is due on ${new Date(payment.dueDate).toLocaleDateString()}`,
          reminderDate: payment.dueDate,
          reminderTime: "09:00",
          priority: "High",
          status: "Pending",
          client: payment.clientId._id,
          branch: payment.recordedBy, // Using recordedBy as branch for existing payments
          assignedTo: payment.recordedBy,
          createdBy: payment.recordedBy,
          notificationMethod: "Email"
        });

        await reminder.save();
        console.log(`Created reminder for payment ${payment._id}`);
      }
    }

    console.log('Finished creating reminders for existing payments');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createRemindersForExistingPayments(); 
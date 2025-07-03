// Usage: node server/scripts/updatePaymentRemindersWithCustomId.js
import mongoose from 'mongoose';
import Reminder from '../models/Reminder.js';
import Enquiry from '../models/Enquiry.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/visa-crm';

async function updateReminders() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  const reminders = await Reminder.find({ category: 'PAYMENT' });
  let updatedCount = 0;

  for (const reminder of reminders) {
    if (!reminder.relatedTo) continue;
    const enquiry = await Enquiry.findById(reminder.relatedTo);
    if (enquiry && enquiry.enquiryId) {
      reminder.enquiryCustomId = enquiry.enquiryId;
      await reminder.save();
      updatedCount++;
      console.log(`Updated reminder ${reminder._id} with enquiryCustomId: ${enquiry.enquiryId}`);
    }
  }

  console.log(`\nUpdate complete. Total reminders updated: ${updatedCount}`);
  await mongoose.disconnect();
}

updateReminders().catch(err => {
  console.error('Error updating reminders:', err);
  process.exit(1);
}); 
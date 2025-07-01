import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  reminderDate: {
    type: Date,
    required: true
  },
  reminderTime: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  repeat: {
    type: String,
    enum: ['None', 'Daily', 'Weekly', 'Monthly'],
    default: 'None'
  },
  notificationMethod: {
    type: String,
    enum: ['Email', 'SMS', 'Both'],
    default: 'Email'
  },
  type: {
    type: String,
    enum: ['BIRTHDAY', 'OTHER'],
    default: 'OTHER'
  },
  email: {
    type: String,
    required: function() {
      return this.type === 'BIRTHDAY';
    }
  },
  mobileNumber: {
    type: String,
    required: function() {
      return this.type === 'BIRTHDAY';
    }
  },
  clientName: {
    type: String,
    required: function() {
      return this.type === 'BIRTHDAY';
    }
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED'],
    default: 'PENDING'
  },
  category: {
    type: String,
    enum: ['BIRTHDAY', 'PAYMENT', 'DOCUMENT', 'APPOINTMENT', 'OTHER'],
    default: 'OTHER'
  },
  dueDate: {
    type: Date,
    required: true
  },
  relatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedToModel',
    required: false
  },
  relatedToModel: {
    type: String,
    enum: ['Enquiry', 'Client', 'Payment'],
    required: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
reminderSchema.index({ type: 1, status: 1 });
reminderSchema.index({ dueDate: 1 });
reminderSchema.index({ relatedTo: 1, relatedToModel: 1 });
reminderSchema.index({ category: 1 });

const Reminder = mongoose.model('Reminder', reminderSchema);

export default Reminder; 
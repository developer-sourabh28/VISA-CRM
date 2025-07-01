import mongoose from 'mongoose';

const whatsappTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['ENQUIRY', 'DEADLINE', 'APPOINTMENT', 'CLIENT', 'OTHER', 'HOTEL', 'FLIGHT', 'BIRTHDAY'],
    default: 'OTHER',
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  body: {
    type: String,
    required: true,
  },
  variables: [{
    type: String,
    trim: true,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Add indexes for better query performance
whatsappTemplateSchema.index({ type: 1, isActive: 1 });
whatsappTemplateSchema.index({ name: 1 }, { unique: true });

// Check if model exists before creating it
const WhatsAppTemplate = mongoose.models.WhatsAppTemplate || mongoose.model('WhatsAppTemplate', whatsappTemplateSchema);

export default WhatsAppTemplate; 
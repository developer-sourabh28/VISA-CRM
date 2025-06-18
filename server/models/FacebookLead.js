import mongoose from 'mongoose';

const facebookLeadSchema = new mongoose.Schema({
  leadId: {
    type: String,
    required: true,
    unique: true,
  },
  formId: {
    type: String,
    required: true,
  },
  createdTime: {
    type: Date,
    required: true,
  },
  fieldData: [{
    name: {
      type: String,
      required: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  }],
  // Additional metadata
  rawData: {
    type: mongoose.Schema.Types.Mixed,
    select: false, // Won't be returned in queries by default
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'converted', 'disqualified'],
    default: 'new',
  },
  notes: {
    type: String,
  },
  lastSyncedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

// Index for faster queries
facebookLeadSchema.index({ leadId: 1 });
facebookLeadSchema.index({ formId: 1 });
facebookLeadSchema.index({ createdTime: -1 });
facebookLeadSchema.index({ status: 1 });

const FacebookLead = mongoose.model('FacebookLead', facebookLeadSchema);

export default FacebookLead; 
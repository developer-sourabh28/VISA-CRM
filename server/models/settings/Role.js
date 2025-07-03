import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  permissions: {
    type: Object,
    default: {
      dashboard: {
        components: []
      },
      enquiries: [],
      clients: [],
      appointments: [],
      deadlines: [],
      quickInvoice: [],
      reports: [],
      reminders: [],
      settings: []
    }
  }
}, { timestamps: true });

// Add strict: false to allow mixed types in permissions
roleSchema.set('strict', false);

const Role = mongoose.model('Role', roleSchema);
export default Role; 
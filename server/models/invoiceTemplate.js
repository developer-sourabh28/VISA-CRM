import mongoose from 'mongoose';

const invoiceTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  body: { type: String, required: true },
  variables: [{ type: String, trim: true }],
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

invoiceTemplateSchema.index({ name: 1 }, { unique: true });

const InvoiceTemplate = mongoose.models.InvoiceTemplate || mongoose.model('InvoiceTemplate', invoiceTemplateSchema);

export default InvoiceTemplate;
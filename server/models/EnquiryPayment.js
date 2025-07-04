import mongoose from 'mongoose';

const EnquiryPaymentSchema = new mongoose.Schema({
  enquiryId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Enquiry', 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  method: { 
    type: String, 
    required: true 
  }, // e.g., 'Credit Card', 'Bank Transfer', 'Cash'
  transactionId: { 
    type: String 
  },
  description: { 
    type: String 
  },
  recordedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  dueDate: { type: Date },
  status: { type: String, enum: ['Paid', 'Pending'], default: 'Paid' },
  paymentType: { type: String, enum: ['Full Payment', 'Partial Payment'], default: 'Full Payment' },
  amountLeft: { type: Number }, // Optional, for partial payments
  totalAmount: { type: Number }, // Optional, for partial payments
}, { timestamps: true });

export default mongoose.model('EnquiryPayment', EnquiryPaymentSchema); 
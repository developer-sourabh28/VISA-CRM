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
}, { timestamps: true });

export default mongoose.model('EnquiryPayment', EnquiryPaymentSchema); 
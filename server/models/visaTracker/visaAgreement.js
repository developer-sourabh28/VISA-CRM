import mongoose from "mongoose";

const visaAgreement = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  
  // Agreement Details
  agreement: {
    type: { type: String, enum: ['Standard', 'Premium', 'Custom'] },
    sentDate: Date,
    clientSignatureDate: Date,
    status: { type: String, enum: ['DRAFT', 'SENT', 'SIGNED', 'REJECTED'] },
    notes: String,
    documentUrl: String,
    completed: { type: Boolean, default: false }
  }

});

export default mongoose.model('VisaAgreement', visaAgreement);
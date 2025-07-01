import mongoose from 'mongoose';

const OtherApplicantDetailSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  name: { type: String, required: true },
  email: { type: String },
  mobileNumber: { type: String },
  nationality: { type: String },
  passportNumber: { type: String },
  dateOfBirth: { type: Date },
  maritalStatus: { type: String },
  occupation: { type: String },
  educationLevel: { type: String },
  document: { type: String }, // Will store the filename of the uploaded PDF
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('OtherApplicantDetail', OtherApplicantDetailSchema); 
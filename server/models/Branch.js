import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
  branchName: { type: String, required: true },
  branchLocation: { type: String, required: true },
  branchId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  contactNo: { type: String, required: true },
  head: {
    name: { type: String, required: true },
    contactNo: { type: String, required: true },
    email: { type: String, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true }
  }
});

export default mongoose.model('Branch', branchSchema);

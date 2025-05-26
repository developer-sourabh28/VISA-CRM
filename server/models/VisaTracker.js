import mongoose from "mongoose";

const visaTrackerSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  steps: [
    {
      step_title: String,
      status: String,
    }
  ],
}, { timestamps: true });

export default mongoose.model('VisaTracker', visaTrackerSchema);
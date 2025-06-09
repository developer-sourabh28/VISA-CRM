import mongoose from "mongoose";

const Deadline = new mongoose.Schema({
  type: {
    type: String,
    enum: ["hotel", "flight", "appointment"],
    required: true,
  },
  clientName: { type: String, required: true },
  visaType: { type: String, required: true },
  dueDate: { type: Date, required: true },
  source: { type: String }, // for hotel/flight
  urgency: { type: String },
  reminder: { type: String },
  lastCancelDate: { type: Date },
  history: { type: Boolean, default: false },
  branchId: { 
    type: String,  // Changed to String to store the branchId directly
    required: false 
  }
}, { timestamps: true });

export default mongoose.model("Deadline", Deadline);
import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  appointmentType: {
    type: String,
    required: true,
    enum: [
      "Initial Consultation", 
      "Document Review", 
      "Embassy Interview", 
      "Biometrics", 
      "Follow-up Meeting",
      "Application Submission"
    ],
  },
  scheduledFor: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number, // in minutes
    default: 60,
  },
  location: {
    type: String,
    default: "Office",
  },
  notes: {
    type: String,
  },
  status: {
    type: String,
    enum: ["Scheduled", "Completed", "Cancelled", "Rescheduled", "No-show"],
    default: "Scheduled",
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  reminderSent: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field
AppointmentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// ✅ Fix OverwriteModelError here
export default mongoose.models.Appointment || mongoose.model("Appointment", AppointmentSchema);

import mongoose from "mongoose";

const ReminderSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Reminder title is required"],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
  },
  reminderDate: {
    type: Date,
    required: true,
  },
  reminderTime: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High", "Urgent"],
    default: "Medium",
  },
  status: {
    type: String,
    enum: ["Pending", "Completed", "Cancelled"],
    default: "Pending",
  },
  repeat: {
    type: String,
    enum: ["None", "Daily", "Weekly", "Monthly"],
    default: "None",
  },
  notificationMethod: {
    type: String,
    enum: ["Email", "WhatsApp", "Both"],
    default: "Email",
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  lastNotified: {
    type: Date,
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
ReminderSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate if reminder is due
ReminderSchema.methods.isDue = function() {
  const now = new Date();
  const reminderDateTime = new Date(this.reminderDate);
  const [hours, minutes] = this.reminderTime.split(':');
  reminderDateTime.setHours(parseInt(hours), parseInt(minutes));
  return reminderDateTime <= now;
};

const Reminder = mongoose.model("Reminder", ReminderSchema);

export default Reminder; 
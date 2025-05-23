import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Task title is required"],
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
  dueDate: {
    type: Date,
    required: true,
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High", "Urgent"],
    default: "Medium",
  },
  status: {
    type: String,
    enum: ["Pending", "In Progress", "Completed", "Cancelled", "Overdue"],
    default: "Pending",
  },
  progress: {
    type: Number, // Percentage from 0 to 100
    default: 0,
    min: 0,
    max: 100,
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
  relatedTo: {
    type: String,
    enum: ["Application", "Document", "Payment", "Appointment", "Other"],
    default: "Other",
  },
  relatedItemId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  completedAt: {
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
TaskSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate if task is overdue
TaskSchema.methods.isOverdue = function() {
  return this.status !== "Completed" && this.dueDate < new Date();
};

const Task = mongoose.model("Task", TaskSchema);

export default Task;

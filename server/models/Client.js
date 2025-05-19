const mongoose = require("mongoose");

const ClientSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "First name is required"],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, "Last name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      "Please provide a valid email",
    ],
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"],
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  passportNumber: {
    type: String,
    required: [true, "Passport number is required"],
  },
  dateOfBirth: {
    type: Date,
    required: [true, "Date of birth is required"],
  },
  nationality: {
    type: String,
    required: [true, "Nationality is required"],
  },
  profileImage: {
    type: String,
    default: "",
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  notes: String,
  status: {
    type: String,
    enum: ["Active", "Inactive", "Completed"],
    default: "Active",
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
ClientSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Get full name
ClientSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model("Client", ClientSchema);

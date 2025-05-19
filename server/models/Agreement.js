const mongoose = require("mongoose");

const AgreementSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  agreementType: {
    type: String,
    required: true,
    enum: ["Standard", "Premium", "Enterprise", "Schengen Visa", "Student Visa", "Work Visa", "Tourist Visa"],
  },
  fileUrl: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  status: {
    type: String,
    enum: ["Draft", "Sent", "Signed", "Rejected", "Expired"],
    default: "Draft",
  },
  sentAt: {
    type: Date,
  },
  signedAt: {
    type: Date,
  },
  expiresAt: {
    type: Date,
  },
  terms: {
    type: String,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
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
AgreementSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Agreement", AgreementSchema);

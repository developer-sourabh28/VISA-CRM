const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
  id: Number,
  title: String,
  status: {
    type: String,
    enum: ['NOT STARTED', 'IN PROGRESS', 'COMPLETED'],
    default: 'NOT STARTED',
  },
  files: [String], // Paths of uploaded files
});

const visaApplicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  steps: [stepSchema],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('VisaApplication', visaApplicationSchema);

import mongoose from 'mongoose';

const DestinationSchema = new mongoose.Schema({
  country: { type: String, required: true },

  visaType: {
    type: String,
    enum: ['Tourist', 'Business', 'Student', 'Work', 'Transit'],
    required: true,
  },

  processingTime: String,
  validity: String,
  stayPeriod: String,
  embassyFee: String,
  serviceFee: String,

  requiredDocuments: {
    type: [String],
    enum: [
      'Passport Copy',
      'Photograph',
      'Flight Booking',
      'Hotel Booking',
      'Bank Statement',
      'Invitation Letter',
      'Employment Letter',
    ],
    default: [],
  },

  notes: String,
});

const Destination = mongoose.model('Destination', DestinationSchema);
export default Destination;

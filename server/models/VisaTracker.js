import mongoose from "mongoose";

const visaTrackerSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  
  // Agreement Details
  agreement: {
    type: { type: String, enum: ['Standard', 'Premium', 'Custom'] },
    sentDate: Date,
    clientSignatureDate: Date,
    status: { type: String, enum: ['DRAFT', 'SENT', 'SIGNED', 'REJECTED'] },
    notes: String,
    documentUrl: String,
    completed: { type: Boolean, default: false }
  },

  // Meeting Details
  meeting: {
    type: { type: String, enum: ['INITIAL', 'DOCUMENT_REVIEW', 'FINAL_REVIEW'] },
    scheduledDate: Date,
    location: { type: String, enum: ['OFFICE', 'VIRTUAL'] },
    notes: String,
    followUpActions: [String],
    completed: { type: Boolean, default: false }
  },

  // Document Collection
  documentCollection: {
    documents: [{
      type: { type: String, enum: ['PASSPORT', 'BANK_STATEMENT', 'INVITATION_LETTER', 'OTHER'] },
      fileUrl: String,
      verificationStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'] },
      notes: String,
      uploadDate: Date
    }],
    collectionStatus: { type: String, enum: ['PENDING', 'COMPLETED'] },
    completed: { type: Boolean, default: false }
  },

  // Visa Application
  visaApplication: {
    type: { type: String, enum: ['TOURIST', 'STUDENT', 'WORK', 'BUSINESS', 'MEDICAL'] },
    formFileUrl: String,
    submissionDate: Date,
    status: { type: String, enum: ['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'] },
    completed: { type: Boolean, default: false }
  },

  // Supporting Documents
  supportingDocuments: {
    documents: [{
      type: { type: String, enum: ['FLIGHT_ITINERARY', 'HOTEL_BOOKING', 'INVITATION_LETTER', 'OTHER'] },
      preparationDate: Date,
      fileUrl: String,
      bookingDetails: {
        portal: String,
        bookingId: String,
        hotelName: String,
        checkInDate: Date,
        checkOutDate: Date,
        cancellationDate: Date,
        leadPassenger: String,
        creditCard: String,
        amount: Number,
        cancellationCharges: Number
      }
    }],
    preparationStatus: { type: String, enum: ['PENDING', 'COMPLETED'] },
    completed: { type: Boolean, default: false }
  },

  // Payment Details
  payment: {
    type: { type: String, enum: ['VISA_FEE', 'SERVICE_FEE', 'DOCUMENTATION_FEE', 'OTHER'] },
    amount: Number,
    method: { type: String, enum: ['BANK_TRANSFER', 'CREDIT_CARD', 'CASH', 'UPI'] },
    transactionId: String,
    status: { type: String, enum: ['PENDING', 'RECEIVED', 'OVERDUE', 'PARTIAL'] },
    dueDate: Date,
    paymentDate: Date,
    completed: { type: Boolean, default: false }
  },

  // Embassy Appointment
  appointment: {
    type: { type: String, enum: ['VISA_INTERVIEW', 'BIOMETRICS', 'DOCUMENT_SUBMISSION'] },
    embassy: String,
    dateTime: Date,
    confirmationNumber: String,
    status: { type: String, enum: ['NOT_SCHEDULED', 'SCHEDULED', 'ATTENDED', 'MISSED', 'RESCHEDULED'] },
    notes: String,
    completed: { type: Boolean, default: false }
  },

  // Visa Outcome
  visaOutcome: {
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'APPEALED'] },
    decisionDate: Date,
    visaNumber: String,
    rejectionReason: String,
    notes: String,
    completed: { type: Boolean, default: false }
  },

  // Overall Status
  overallStatus: { 
    type: String, 
    enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'],
    default: 'NOT_STARTED'
  },

  // Progress tracking
  progress: {
    completedSteps: { type: Number, default: 0 },
    totalSteps: { type: Number, default: 7 },
    percentage: { type: Number, default: 0 }
  }
}, { timestamps: true });

// Method to calculate progress
visaTrackerSchema.methods.calculateProgress = function() {
  const steps = [
    this.agreement?.completed || false,
    this.meeting?.completed || false,
    this.documentCollection?.completed || false,
    this.visaApplication?.completed || false,
    this.supportingDocuments?.completed || false,
    this.payment?.completed || false,
    this.appointment?.completed || false
  ];

  const completedSteps = steps.filter(step => step).length;
  const percentage = Math.round((completedSteps / this.progress.totalSteps) * 100);

  this.progress = {
    completedSteps,
    totalSteps: this.progress.totalSteps,
    percentage
  };

  // Update overall status based on progress
  if (percentage === 0) {
    this.overallStatus = 'NOT_STARTED';
  } else if (percentage === 100) {
    this.overallStatus = 'COMPLETED';
  } else {
    this.overallStatus = 'IN_PROGRESS';
  }

  return this.progress;
};

// Pre-save middleware to calculate progress
visaTrackerSchema.pre('save', function(next) {
  this.calculateProgress();
  next();
});

export default mongoose.model('VisaTracker', visaTrackerSchema);
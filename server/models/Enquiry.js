import mongoose from 'mongoose';

const EnquirySchema = new mongoose.Schema({
  // 1. Enquirer Information
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  alternatePhone: { type: String },
  nationality: { type: String, required: true },
  currentCountry: { type: String, required: true },
  preferredContactMethod: {
    type: String,
    enum: ["Email", "Phone", "WhatsApp", "SMS"],
    default: "Email",
  },
  preferredContactTime: { type: String },

  // 2. Visa Enquiry Details
  visaType: {
    type: String,
    enum: [
      "Tourist",
      "Student",
      "Work",
      "Business",
      "PR",
      "Dependent",
      "Other",
    ],
    // required: true,
    default: "Tourist",
  },
  destinationCountry: {
    type: String,
    enum: [
      "USA",
      "Canada",
      "UK",
      "Australia",
      "New Zealand",
      "Schengen",
      "UAE",
      "Other",
    ],
    // required: true,
    default: "USA",
  },
  purposeOfTravel: { type: String },
  intendedTravelDate: { type: Date },
  durationOfStay: { type: String },
  previousVisaApplications: {
    type: String,
    enum: ["Yes", "No"],
    default: "No",
  },
  visaUrgency: {
    type: String,
    enum: ["Normal", "Urgent", "Express"],
    default: "Normal",
  },

  // 3. Additional Applicant Details
  passportNumber: { type: String, required: true  },
  passportExpiryDate: { type: Date },
  dateOfBirth: { type: Date , required: true },
  maritalStatus: {
    type: String,
    enum: ["Single", "Married", "Divorced", "Widowed"],
    default: "Single",
  },
  numberOfApplicants: { type: Number },
  occupation: { type: String },
  educationLevel: {
    type: String,
    enum: ["High School", "Bachelor's", "Master's", "PhD", "Other"],
    default: "Bachelor's",
  },

  // 4. Source and Marketing Information
  enquirySource: {
    type: String,
    enum: [
      "Website",
      "Social Media",
      "Referral",
      "Walk-in",
      "Advertisement",
      "Other",
    ],
    default: "Website",
  },
  campaignName: { type: String },
  referredBy: { type: String },
  branch: {
    type: String,
    enum: [
      "Abu Dhabi",
      "New York"
    ],
    default: "Main Office",
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },

  // 5. Internal Tracking and Assignment
  enquiryStatus: {
    type: String,
    enum: [
      "New",
      "Contacted",
      "Qualified",
      "Processing",
      "Closed",
      "Lost",
    ],
    default: "New",
  },
  assignedConsultant: { type: String },
  followUpDate: { type: Date },
  priorityLevel: {
    type: String,
    enum: ["High", "Medium", "Low"],
    default: "Medium",
  },
  notes: { type: String },

  createdAt: { type: Date, default: Date.now },
  isClient: { type: Boolean, default: false }
});

export default mongoose.model('Enquiry', EnquirySchema);
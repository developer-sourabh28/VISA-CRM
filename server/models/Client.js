import mongoose from 'mongoose';

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
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  assignedConsultant: {
    type: String,
  },
  visaType: {
    type: String,
    enum: ["Tourist", "Work", "Student", "Transit", "Business", "PR", "Dependent", "Other"],
    trim: true,
  },
  visaStatus: {
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
  },
  notes: String, // General notes about the client
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
  if (this.visaStatus) {
    this.visaStatus.updatedAt = Date.now();
  }
  next();
});

// Get full name
ClientSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to set default branch if none is provided
ClientSchema.pre('save', async function(next) {
  if (!this.branchId) {
    try {
      const Branch = mongoose.model('Branch');
      const defaultBranch = await Branch.findOne();
      if (defaultBranch) {
        this.branchId = defaultBranch._id;
      }
    } catch (error) {
      console.error('Error setting default branch:', error);
    }
  }
  next();
});

// Check if the model exists before creating it
const Client = mongoose.models.Client || mongoose.model('Client', ClientSchema);

export default Client;

import mongoose from "mongoose";
import  paymentStatus  from "../constants/paymentStatus.js";

const PaymentSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  paymentMethod: {
    type: String,
    enum: ["Cash", "Card", "Credit Card", "Debit Card", "UPI", "Bank Transfer", "Cheque", "Online Transfer", "Other"],
    required: true,
  },
  description: String,
  status: {
    type: String,
    enum: ["Pending", "Completed", "Failed", "Partial"],
    default: "Completed",
  },
  paymentType: {
    type: String,
    enum: ["Full Payment", "Partial Payment"],
    required: true,
  },
  installments: {
    totalCount: {
      type: Number,
      default: 1,
    },
    currentInstallment: {
      type: Number,
      default: 1,
    },
    nextInstallmentAmount: {
      type: Number,
    },
    nextInstallmentDate: {
      type: Date,
    },
    installmentHistory: [{
      installmentNumber: Number,
      amount: Number,
      dueDate: Date,
      paidDate: Date,
      status: {
        type: String,
        enum: ["Pending", "Completed", "Overdue"],
        default: "Pending"
      }
    }]
  },
  invoiceNumber: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  currency: {
    type: String,
    default: "INR",
  },
  paymentDate: {
    type: Date,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  receiptNumber: {
    type: String,
  },
  receiptUrl: {
    type: String,
  },
  invoiceUrl: {
    type: String,
  },
  notes: {
    type: String,
  },
  serviceType: {
    type: String,
    enum: ["Visa Application", "Document Processing", "Consultation", "Embassy Fee", "Other"],
    required: true,
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  visaTrackerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "VisaTracker",
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field
PaymentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Check if payment is overdue
PaymentSchema.virtual("isOverdue").get(function () {
  if (this.paymentType === "Partial Payment") {
    return this.installments.nextInstallmentDate && this.installments.nextInstallmentDate < new Date();
  }
  return this.status === paymentStatus.PENDING && this.dueDate < new Date();
});

// Pre-save middleware to handle dates
PaymentSchema.pre('save', function(next) {
  // Ensure valid dates
  if (this.date && !(this.date instanceof Date)) {
    this.date = new Date(this.date);
  }
  if (this.dueDate && !(this.dueDate instanceof Date)) {
    this.dueDate = new Date(this.dueDate);
  }
  if (this.paymentDate && !(this.paymentDate instanceof Date)) {
    this.paymentDate = new Date(this.paymentDate);
  }
  if (this.createdAt && !(this.createdAt instanceof Date)) {
    this.createdAt = new Date(this.createdAt);
  }

  // Handle installment dates
  if (this.installments && this.installments.nextInstallmentDate) {
    if (!(this.installments.nextInstallmentDate instanceof Date)) {
      this.installments.nextInstallmentDate = new Date(this.installments.nextInstallmentDate);
    }
  }

  // Handle installment history dates
  if (this.installments && this.installments.installmentHistory) {
    this.installments.installmentHistory.forEach(installment => {
      if (installment.dueDate && !(installment.dueDate instanceof Date)) {
        installment.dueDate = new Date(installment.dueDate);
      }
      if (installment.paidDate && !(installment.paidDate instanceof Date)) {
        installment.paidDate = new Date(installment.paidDate);
      }
    });
  }

  next();
});

const Payment = mongoose.model("Payment", PaymentSchema);

export default Payment;

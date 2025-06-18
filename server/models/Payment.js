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
  method: {
    type: String,
    enum: ["Cash", "Card", "UPI", "Bank Transfer"],
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

const Payment = mongoose.model("Payment", PaymentSchema);

export default Payment;

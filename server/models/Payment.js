import mongoose from "mongoose";
import  paymentStatus  from "../constants/paymentStatus.js";

const PaymentSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: "USD",
  },
  paymentMethod: {
    type: String,
    enum: ["Credit Card", "Bank Transfer", "Cash", "Check", "PayPal", "Other"],
    required: true,
  },
  paymentDate: {
    type: Date,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(paymentStatus),
    default: paymentStatus.PENDING,
  },
  description: {
    type: String,
    required: true,
  },
  receiptNumber: {
    type: String,
  },
  receiptUrl: {
    type: String,
  },
  invoiceNumber: {
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
PaymentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Check if payment is overdue
PaymentSchema.virtual("isOverdue").get(function () {
  return this.status === paymentStatus.PENDING && this.dueDate < new Date();
});

const Payment = mongoose.model("Payment", PaymentSchema);

export default Payment;

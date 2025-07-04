import EnquiryPayment from '../models/EnquiryPayment.js';
import Enquiry from '../models/Enquiry.js';
import Client from '../models/Client.js';
import Payment from '../models/Payment.js';
import mongoose from 'mongoose';

export const createEnquiryPayment = async (req, res) => {
  try {
    const { enquiryId } = req.params;
    const paymentData = req.body;
    const recordedBy = req.user._id;

    const enquiry = await Enquiry.findById(enquiryId);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    // If enquiry is a client, create a full payment record
    if (enquiry.isClient) {
      const client = await Client.findOne({ email: enquiry.email });
      if (!client) {
        return res.status(404).json({ success: false, message: 'Associated client not found for this enquiry.' });
      }

      const newPayment = new Payment({
        clientId: client._id,
        amount: paymentData.amount,
        date: paymentData.date,
        paymentMethod: paymentData.method,
        description: paymentData.description,
        status: paymentData.status || 'Completed',
        paymentType: paymentData.paymentType || 'Full Payment',
        installments: {
          totalCount: paymentData.numberOfInstallments || 1,
          currentInstallment: paymentData.paymentType === 'Partial Payment' ? 1 : paymentData.numberOfInstallments,
          nextInstallmentAmount: paymentData.paymentType === 'Partial Payment' ? (paymentData.totalAmount - paymentData.amount) : 0,
          nextInstallmentDate: paymentData.dueDate,
        },
        dueDate: paymentData.dueDate || new Date(),
        serviceType: 'Visa Application', // Or derive from enquiry
        recordedBy,
        enquiryId: enquiry._id,
      });

      await newPayment.save();
      return res.status(201).json({ success: true, data: newPayment, message: 'Client payment created successfully' });
    }

    // Otherwise, create a simple enquiry payment
    const newEnquiryPayment = await EnquiryPayment.create({
      enquiryId,
      amount: paymentData.amount,
      date: paymentData.date,
      method: paymentData.method,
      transactionId: paymentData.transactionId,
      description: paymentData.description,
      recordedBy
    });

    res.status(201).json({ success: true, data: newEnquiryPayment, message: 'Enquiry payment created successfully' });
  } catch (error) {
    console.error('Error creating enquiry payment:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

export const getEnquiryPayments = async (req, res) => {
  try {
    const { enquiryId } = req.params;

    const enquiry = await Enquiry.findById(enquiryId);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    if (enquiry.isClient) {
      const client = await Client.findOne({ email: enquiry.email });
      if (client) {
        const clientPayments = await Payment.find({ clientId: client._id }).sort({ date: -1 });
        return res.status(200).json({ success: true, data: clientPayments });
      }
    }

    const payments = await EnquiryPayment.find({ enquiryId }).populate('recordedBy', 'name').sort({ date: -1 });
    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    console.error('Error fetching enquiry payments:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
}; 
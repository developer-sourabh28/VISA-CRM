import EnquiryPayment from '../models/EnquiryPayment.js';
import Enquiry from '../models/Enquiry.js';

export const createEnquiryPayment = async (req, res) => {
  try {
    const { enquiryId } = req.params;
    const { amount, date, method, transactionId, description } = req.body;
    const recordedBy = req.user._id;

    if (!amount || !date || !method) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const enquiry = await Enquiry.findById(enquiryId);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    const newPayment = await EnquiryPayment.create({
      enquiryId,
      amount,
      date,
      method,
      transactionId,
      description,
      recordedBy
    });

    res.status(201).json({ success: true, data: newPayment, message: 'Payment created successfully' });
  } catch (error) {
    console.error('Error creating enquiry payment:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

export const getEnquiryPayments = async (req, res) => {
  try {
    const { enquiryId } = req.params;
    const payments = await EnquiryPayment.find({ enquiryId }).populate('recordedBy', 'name').sort({ date: -1 });
    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    console.error('Error fetching enquiry payments:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
}; 
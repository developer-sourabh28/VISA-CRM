import EnquiryPayment from '../models/EnquiryPayment.js';
import Enquiry from '../models/Enquiry.js';
import Reminder from '../models/Reminder.js';

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
      recordedBy,
      dueDate: req.body.dueDate,
      status: req.body.status,
      paymentType: req.body.paymentType,
      amountLeft: req.body.amountLeft,
      totalAmount: req.body.totalAmount
    });

    if (req.body.paymentType === 'Partial Payment' && req.body.dueDate) {
      const amountLeft = req.body.totalAmount - req.body.amount;
      await Reminder.create({
        title: `Part Payment Due for ${enquiry.firstName} ${enquiry.lastName}`,
        description: `Payment of ${amountLeft} INR for enquiry ${enquiry.enquiryId} is due.`,
        reminderDate: req.body.dueDate,
        dueDate: req.body.dueDate,
        reminderTime: "09:00",
        priority: "High",
        status: "PENDING",
        relatedTo: enquiry._id,
        relatedToModel: "Enquiry",
        category: "PAYMENT"
      });
    }

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
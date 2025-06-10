import Payment from '../models/Payment.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all payments for a client
export const getClientPayments = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { user } = req;

    // Build query based on user role
    let query = { clientId };
    if (!user.isAdmin) {
      query.recordedBy = user._id;
    }

    const payments = await Payment.find(query)
      .populate('clientId', 'name email phone')
      .populate('recordedBy', 'name email')
      .sort({ date: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all payments for the current user or all if admin
export const getAllPayments = async (req, res) => {
  try {
    const { user } = req;
    
    // Build query based on user role
    let query = {};
    if (!user.isAdmin) {
      query.recordedBy = user._id;
    }

    const payments = await Payment.find(query)
      .populate('clientId', 'name email phone')
      .populate('recordedBy', 'name email')
      .sort({ date: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new payment
export const createPayment = async (req, res) => {
  try {
    const payment = new Payment({
      ...req.body,
      recordedBy: req.user._id
    });
    const savedPayment = await payment.save();
    
    const populatedPayment = await Payment.findById(savedPayment._id)
      .populate('clientId', 'name email phone')
      .populate('recordedBy', 'name email');

    res.status(201).json(populatedPayment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Generate invoice for a payment
export const generateInvoice = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId)
      .populate('clientId')
      .populate('recordedBy');
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if user has permission to access this payment
    if (!req.user.isAdmin && payment.recordedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this payment' });
    }

    // Create a PDF document
    const doc = new PDFDocument();
    const fileName = `invoice_${payment._id}.pdf`;
    const filePath = path.join(__dirname, '../uploads', fileName);

    // Pipe the PDF to a file
    doc.pipe(fs.createWriteStream(filePath));

    // Read the letterhead template
    const letterheadPath = path.join(__dirname, '../../Letter head bright star 2.docx');
    
    // Add letterhead image if exists
    if (fs.existsSync(letterheadPath)) {
      doc.image(letterheadPath, {
        fit: [500, 150],
        align: 'center'
      });
    }

    // Add invoice content
    doc.moveDown(2);
    doc.fontSize(20).text('INVOICE', { align: 'center' });
    doc.moveDown();
    
    // Add invoice details
    doc.fontSize(12);
    doc.text(`Invoice Number: ${payment.invoiceNumber || payment._id}`);
    doc.text(`Date: ${new Date(payment.date).toLocaleDateString()}`);
    doc.moveDown();
    
    // Add client details
    doc.text(`Client Name: ${payment.clientId.name}`);
    doc.text(`Email: ${payment.clientId.email}`);
    doc.text(`Phone: ${payment.clientId.phone}`);
    doc.moveDown();
    
    // Add payment details
    doc.text(`Service Type: ${payment.serviceType}`);
    doc.text(`Amount: ₹${payment.amount}`);
    doc.text(`Payment Method: ${payment.method}`);
    doc.text(`Payment Status: ${payment.status}`);
    if (payment.description) {
      doc.text(`Description: ${payment.description}`);
    }
    
    // Add recorded by details
    doc.moveDown();
    doc.text(`Recorded By: ${payment.recordedBy.name}`);
    doc.text(`Branch: ${payment.clientId.branchName || 'Main Branch'}`);
    
    // Add footer
    doc.moveDown(2);
    doc.fontSize(10).text('Thank you for your business!', { align: 'center' });
    
    // Finalize the PDF
    doc.end();

    // Send the file
    res.download(filePath, fileName, (err) => {
      if (err) {
        res.status(500).json({ message: 'Error downloading file' });
      }
      // Clean up - delete the file after sending
      fs.unlinkSync(filePath);
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 
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
      .populate('clientId', 'firstName lastName email phone')
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
      .populate('clientId', 'firstName lastName email phone')
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
      .populate('clientId', 'firstName lastName email phone')
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
      .populate('clientId', 'firstName lastName email phone address passportNumber')
      .populate('recordedBy');
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if user has permission to access this payment
    if (!req.user.isAdmin && payment.recordedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this payment' });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Create a PDF document
    const doc = new PDFDocument({ size: 'A4', margin: 0 }); // Remove default margins
    const fileName = `invoice_${payment._id}.pdf`;
    const filePath = path.join(uploadsDir, fileName);

    // Pipe the PDF to a file
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Define colors to match the image
    const primaryRed = '#CC0000'; // Bright red from the image
    const goldColor = '#DAA520'; // Gold accent
    const darkGray = '#333333';
    const lightGray = '#666666';

    // Page dimensions
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const contentMargin = 40;

    // --- Header Section ---
    // Create the curved red header background
    doc.save();
    
    // Main red header area
    doc.rect(0, 0, pageWidth, 120)
       .fill(primaryRed);
    
    // Create the curved bottom of the header
    doc.moveTo(0, 120)
       .bezierCurveTo(pageWidth * 0.3, 140, pageWidth * 0.7, 140, pageWidth, 120)
       .lineTo(pageWidth, 0)
       .lineTo(0, 0)
       .fill(primaryRed);
    
    // Add golden accent curve
    doc.moveTo(0, 110)
       .bezierCurveTo(pageWidth * 0.3, 130, pageWidth * 0.7, 130, pageWidth, 110)
       .lineWidth(3)
       .stroke(goldColor);
    
    doc.restore();

    // Add logo and company name in header
    const logoPath = path.join(__dirname, '../../client/public/letterhead.png');
    if (fs.existsSync(logoPath)) {
      // Position logo on the right side of header
      doc.image(logoPath, pageWidth - 180, 20, {
        fit: [160, 80],
        align: 'right'
      });
    }

    // --- White content area setup ---
    let currentY = 160; // Start below the curved header

    // Invoice details section
    doc.fillColor(darkGray)
       .fontSize(10)
       .font('Helvetica');

    // Invoice Number and Date - top left
    doc.text(`Invoice Number: ${payment.invoiceNumber || `INV-${payment._id.toString().slice(-6).toUpperCase()}`}`, contentMargin, currentY);
    doc.text(`Date: ${new Date(payment.date).toLocaleDateString('en-GB')}`, contentMargin, currentY + 15);

    currentY += 50;

    // INVOICE title
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor(primaryRed)
       .text('INVOICE', contentMargin, currentY);

    currentY += 40;

    // Horizontal line under INVOICE
    doc.strokeColor(lightGray)
       .lineWidth(1)
       .moveTo(contentMargin, currentY)
       .lineTo(pageWidth - contentMargin, currentY)
       .stroke();

    currentY += 30;

    // --- Billed To Section ---
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(darkGray)
       .text('Billed To:', contentMargin, currentY);

    currentY += 20;

    doc.fontSize(10)
       .font('Helvetica');

    // Client details
    const clientName = `${payment.clientId?.firstName || ''} ${payment.clientId?.lastName || ''}`.trim();
    doc.text(`Client's Full Name: ${clientName || 'N/A'}`, contentMargin, currentY);
    currentY += 15;

    // Format address properly
    const address = payment.clientId?.address;
    let clientAddress = 'N/A';
    if (address) {
      const addressParts = [
        address.street,
        address.city,
        address.state,
        address.postalCode,
        address.country
      ].filter(part => part && part.trim() !== '');
      clientAddress = addressParts.length > 0 ? addressParts.join(', ') : 'N/A';
    }
    doc.text(`Client's Address: ${clientAddress}`, contentMargin, currentY);
    currentY += 15;

    doc.text(`Client's Contact Information: Email: ${payment.clientId?.email || 'N/A'}, Phone: ${payment.clientId?.phone || 'N/A'}`, contentMargin, currentY);
    currentY += 15;

    doc.text(`Passport Number: ${payment.clientId?.passportNumber || 'N/A'}`, contentMargin, currentY);
    currentY += 40;

    // --- Service Table ---
    const tableStartY = currentY;
    const descCol = contentMargin;
    const amountCol = pageWidth - 180;

    // Table headers with background
    doc.rect(contentMargin, tableStartY, pageWidth - (2 * contentMargin), 25)
       .fill('#F5F5F5');

    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor(darkGray)
       .text('Description', descCol + 10, tableStartY + 8);
    
    doc.text('Total Amount', amountCol, tableStartY + 8, { 
      width: 120, 
      align: 'right' 
    });

    // Table content row
    const rowY = tableStartY + 25;
    doc.rect(contentMargin, rowY, pageWidth - (2 * contentMargin), 30)
       .stroke('#E0E0E0');

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(darkGray)
       .text(payment.serviceType || 'Schengen Visa Assistance Service', descCol + 10, rowY + 10);

    doc.text(`Rs. ${payment.amount?.toLocaleString('en-IN') || 0}`, amountCol, rowY + 10, { 
      width: 120, 
      align: 'right' 
    });

    currentY = rowY + 30 + 20;

    // --- Payment Details ---
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor(darkGray)
       .text(`Total Amount Payable: Rs. ${payment.amount?.toLocaleString('en-IN') || 0}`, contentMargin, currentY);

    currentY += 15;

    doc.fontSize(10)
       .font('Helvetica')
       .text(`Payment Method: ${payment.method || 'N/A'}`, contentMargin, currentY);

    currentY += 30;

    // Separator line
    doc.strokeColor('#E0E0E0')
       .lineWidth(1)
       .moveTo(contentMargin, currentY)
       .lineTo(pageWidth - contentMargin, currentY)
       .stroke();

    currentY += 30;

    // --- Terms and Conditions ---
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(primaryRed)
       .text('Terms and Conditions', contentMargin, currentY);

    currentY += 20;

    const terms = [
      "1. This invoice covers assistance services only and does not guarantee visa approval.",
      "2. All fees are non-refundable, regardless of the outcome of the visa application.",
      "3. Services include application form assistance, documentation guidance, and appointment scheduling (if applicable).", 
      "4. The client is responsible for providing truthful and complete documents."
    ];

    doc.fontSize(9)
       .font('Helvetica')
       .fillColor(darkGray);

    terms.forEach((term, index) => {
      if (index === 1) {
        // Handle the non-refundable term with bold text
        const parts = term.split('non-refundable');
        doc.text(parts[0], contentMargin, currentY, { continued: true })
           .font('Helvetica-Bold')
           .text('non-refundable', { continued: true })
           .font('Helvetica')
           .text(parts[1]);
      } else {
        doc.text(term, contentMargin, currentY, {
          width: pageWidth - (2 * contentMargin),
          lineGap: 2
        });
      }
      currentY += 20;
    });

    currentY += 20;

    // --- Declaration ---
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(primaryRed)
       .text('Declaration:', contentMargin, currentY);

    currentY += 15;

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(darkGray)
       .text('We hereby declare that the above-mentioned services were provided to the client as agreed.', contentMargin, currentY);

    currentY += 40;

    // --- Signature Section ---
    const signatureY = currentY;
    const leftSigX = contentMargin + 50;
    const rightSigX = pageWidth - contentMargin - 150;
    const signatureWidth = 120;

    // Draw signature lines
    doc.strokeColor(darkGray)
       .lineWidth(1)
       .moveTo(leftSigX, signatureY)
       .lineTo(leftSigX + signatureWidth, signatureY)
       .stroke();

    doc.moveTo(rightSigX, signatureY)
       .lineTo(rightSigX + signatureWidth, signatureY)
       .stroke();

    // Signature labels
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor(darkGray)
       .text('Authorized Signatory', leftSigX, signatureY + 10, { 
         width: signatureWidth, 
         align: 'center' 
       });

    doc.text('Applicant Signature', rightSigX, signatureY + 10, { 
      width: signatureWidth, 
      align: 'center' 
    });

    // --- Footer Section ---
    const footerY = pageHeight - 80;
    
    // Footer background
    doc.rect(0, footerY - 10, pageWidth, 90)
       .fill(primaryRed);

    // Footer addresses
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('white');

    // Address icons and text
    const iconPath = path.join(__dirname, '../../client/public/map_pin.png');
    const iconSize = 10;

    if (fs.existsSync(iconPath)) {
      doc.image(iconPath, contentMargin, footerY + 5, { width: iconSize, height: iconSize });
      doc.image(iconPath, contentMargin, footerY + 25, { width: iconSize, height: iconSize });
    }

    doc.text('Address- Abu Dhabi Branch -804, Al junaibi Tower, Muroor Road, Abu Dhabi.', 
             contentMargin + 20, footerY + 5);
    
    doc.text('Dubai Branch- M 234,Unique World Business Center, Near Ansar Gallery, Al Karama, Dubai.', 
             contentMargin + 20, footerY + 25);

    // Finalize the PDF
    doc.end();

    // Handle write stream events
    writeStream.on('error', (error) => {
      console.error('Error writing PDF file:', error);
      res.status(500).json({ message: 'Error generating PDF file' });
    });

    writeStream.on('finish', () => {
      // Send the file
      res.download(filePath, fileName, (err) => {
        if (err) {
          console.error('Error sending file:', err);
          res.status(500).json({ message: 'Error downloading file' });
        }
        // Clean up - delete the file after sending
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error('Error deleting temporary file:', unlinkErr);
          }
        });
      });
    });

  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ 
      message: 'Error generating invoice',
      error: error.message 
    });
  }
};
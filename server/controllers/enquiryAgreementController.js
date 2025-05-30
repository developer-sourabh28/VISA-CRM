import EnquiryAgreement from '../models/EnquiryAgreement.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/agreements';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Get agreement for an enquiry
export const getEnquiryAgreement = async (req, res) => {
    try {
        const { enquiryId } = req.params;
        const agreement = await EnquiryAgreement.findOne({ enquiryId });
        
        if (!agreement) {
            return res.status(404).json({
                success: false,
                message: 'No agreement found for this enquiry'
            });
        }

        res.status(200).json({
            success: true,
            data: agreement
        });
    } catch (error) {
        console.error('Error in getEnquiryAgreement:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Create or update agreement for an enquiry
export const createOrUpdateEnquiryAgreement = async (req, res) => {
    try {
        const { enquiryId } = req.params;
        
        // Handle file upload if present
        let fileData = null;
        if (req.file) {
            fileData = {
                name: req.file.filename,
                url: `/api/enquiries/agreements/file/${req.file.filename}`
            };
        }

        // Parse form data
        const agreementData = {
            enquiryId,
            agreementDate: req.body.agreementDate,
            agreementStatus: req.body.agreementStatus || 'NOT_SENT',
            notes: req.body.notes,
            ...(fileData && { agreementFile: fileData })
        };

        // Validate required fields
        if (!agreementData.agreementDate) {
            return res.status(400).json({
                success: false,
                message: 'Agreement date is required'
            });
        }

        // Check if agreement exists
        let agreement = await EnquiryAgreement.findOne({ enquiryId });

        if (agreement) {
            // Update existing agreement
            agreement = await EnquiryAgreement.findOneAndUpdate(
                { enquiryId },
                { ...agreementData, updatedAt: Date.now() },
                { new: true, runValidators: true }
            );
        } else {
            // Create new agreement
            agreement = new EnquiryAgreement(agreementData);
            await agreement.save();
        }

        res.status(200).json({
            success: true,
            data: agreement,
            message: agreement ? 'Agreement updated successfully' : 'Agreement created successfully'
        });
    } catch (error) {
        console.error('Error in createOrUpdateEnquiryAgreement:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 
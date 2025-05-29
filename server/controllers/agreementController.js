// agreementController.js - For GridFS storage
import Agreement from '../models/Agreement.js';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

// Initialize GridFS bucket
let gfsBucket;
mongoose.connection.once('open', () => {
    gfsBucket = new GridFSBucket(mongoose.connection.db, {
        bucketName: 'agreements'
    });
    console.log('GridFS bucket initialized');
});

export const createAgreement = async (req, res) => {
    try {
        const { branchName } = req.body;
        const file = req.file;
        
        console.log('Request body:', req.body);
        console.log('Uploaded file:', file);
        
        if (!branchName || !file) {
            return res.status(400).json({ message: "Branch name and PDF are required" });
        }
        
        // Check if agreement already exists
        const existing = await Agreement.findOne({ branch_name: branchName });
        if (existing) {
            // Delete the uploaded file from GridFS since we're not using it
            if (file.id) {
                try {
                    await gfsBucket.delete(new mongoose.Types.ObjectId(file.id));
                } catch (deleteError) {
                    console.error('Error deleting duplicate file:', deleteError);
                }
            }
            return res.status(400).json({ message: "Agreement already exists for this branch" });
        }
        
        // Create new agreement with GridFS file ID
        const newAgreement = new Agreement({
            branch_name: branchName,
            pdf_file_id: file.id,
            pdf_url: file.filename // Store filename for reference
        });
        
        await newAgreement.save();
        
        res.status(201).json({ 
            message: "Agreement created successfully", 
            agreement: {
                branch_name: newAgreement.branch_name,
                pdf_url: newAgreement.pdf_url,
                file_id: newAgreement.pdf_file_id
            }
        });
    } catch (err) {
        console.error('Error creating agreement:', err);
        
        // Clean up uploaded file if there's an error
        if (req.file && req.file.id) {
            try {
                await gfsBucket.delete(new mongoose.Types.ObjectId(req.file.id));
            } catch (deleteError) {
                console.error('Error cleaning up file:', deleteError);
            }
        }
        
        res.status(500).json({ error: err.message });
    }
};

export const getAllAgreements = async (req, res) => {
    try {
        const agreements = await Agreement.find({}, { branch_name: 1, pdf_url: 1, _id: 0 });
        res.json(agreements);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getAgreementByBranch = async (req, res) => {
    try {
        const { branchName } = req.params;
        
        const agreement = await Agreement.findOne(
            { branch_name: branchName },
            { branch_name: 1, pdf_url: 1, pdf_file_id: 1, _id: 0 }
        );
        
        if (!agreement) {
            return res.status(404).json({ message: 'Agreement not found' });
        }
        
        res.json(agreement);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Serve PDF file from GridFS
export const getPDFFile = async (req, res) => {
    try {
        const { filename } = req.params;
        
        if (!gfsBucket) {
            return res.status(500).json({ message: 'GridFS not initialized' });
        }
        
        // Find file by filename
        const files = await gfsBucket.find({ filename }).toArray();
        
        if (!files || files.length === 0) {
            return res.status(404).json({ message: 'File not found' });
        }
        
        const file = files[0];
        
        // Set proper headers for PDF
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${file.filename}"`
        });
        
        // Create download stream
        const downloadStream = gfsBucket.openDownloadStream(file._id);
        
        downloadStream.on('error', (error) => {
            console.error('Download stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({ message: 'Error streaming file' });
            }
        });
        
        downloadStream.pipe(res);
        
    } catch (err) {
        console.error('Error serving PDF:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: err.message });
        }
    }
};

// FIXED: Delete agreement by branch name instead of ID
export const deleteAgreement = async (req, res) => {
    try {
        const { branchName } = req.params;
        console.log('Deleting agreement for branch:', branchName);
        
        const agreement = await Agreement.findOne({ branch_name: branchName });
        
        if (!agreement) {
            return res.status(404).json({ message: 'Agreement not found' });
        }
        
        // Delete file from GridFS
        if (agreement.pdf_file_id && gfsBucket) {
            try {
                await gfsBucket.delete(new mongoose.Types.ObjectId(agreement.pdf_file_id));
                console.log('File deleted from GridFS');
            } catch (deleteError) {
                console.error('Error deleting file from GridFS:', deleteError);
                // Continue with database deletion even if file deletion fails
            }
        }
        
        // Delete from database
        await Agreement.deleteOne({ branch_name: branchName });
        
        res.json({ message: 'Agreement deleted successfully' });
    } catch (err) {
        console.error('Error deleting agreement:', err);
        res.status(500).json({ error: err.message });
    }
};
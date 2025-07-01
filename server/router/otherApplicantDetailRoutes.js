import express from 'express';
import { createOtherApplicantDetail, getOtherApplicantDetails, deleteOtherApplicantDetail } from '../controllers/otherApplicantDetailController.js';
import multer from 'multer';
import path from 'path';
import { GridFsStorage } from 'multer-gridfs-storage';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Configure GridFS storage with a simpler configuration
const storage = new GridFsStorage({
    url: process.env.MONGO_URI,
    file: (req, file) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = uniqueSuffix + path.extname(file.originalname);
        return {
            filename: filename,
            bucketName: 'uploads'
        };
    }
});

// Configure multer with error handling
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        // Accept only PDF files
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
}).array('documents', 10); // Allow up to 10 documents

// Wrapper for handling multer errors
const uploadMiddleware = (req, res, next) => {
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading
            console.error('Multer error:', err);
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'File size is too large. Maximum size is 5MB'
                });
            }
            if (err.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({
                    success: false,
                    message: 'Too many files. Maximum is 10 files'
                });
            }
            return res.status(400).json({
                success: false,
                message: `File upload error: ${err.message}`
            });
        } else if (err) {
            // An unknown error occurred
            console.error('Upload error:', err);
            return res.status(500).json({
                success: false,
                message: `Upload error: ${err.message}`
            });
        }
        // Everything went fine
        next();
    });
};

router.post('/', uploadMiddleware, createOtherApplicantDetail);
router.get('/:clientId', getOtherApplicantDetails);
router.delete('/:id', deleteOtherApplicantDetail);

export default router; 
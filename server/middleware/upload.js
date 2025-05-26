// upload.js - Fixed GridFS configuration
import { GridFsStorage } from 'multer-gridfs-storage';
import multer from 'multer';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

// First ensure MongoDB connection
const connectDB = async () => {
    try {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI);
            console.log('MongoDB connected for GridFS');
        }
    } catch (error) {
        console.error('MongoDB connection error:', error);
    }
};

// Initialize connection
await connectDB();

const storage = new GridFsStorage({
    url: process.env.MONGO_URI,
    options: { 
        useNewUrlParser: true, 
        useUnifiedTopology: true 
    },
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            try {
                const fileInfo = {
                    filename: `${Date.now()}-${file.originalname}`,
                    bucketName: 'agreements', // Collection name in MongoDB
                    metadata: {
                        branchName: req.body.branchName,
                        uploadDate: new Date(),
                        originalName: file.originalname
                    }
                };
                resolve(fileInfo);
            } catch (error) {
                reject(error);
            }
        });
    }
});

// Event listeners for debugging
storage.on('connection', (db) => {
    console.log('✅ GridFS connection established');
});

storage.on('connectionFailed', (err) => {
    console.error('❌ GridFS connection failed:', err);
});

storage.on('file', (file) => {
    console.log('✅ File uploaded to GridFS:', file.filename);
});

storage.on('streamError', (error, conf) => {
    console.error('❌ GridFS stream error:', error);
    console.log('File config:', conf);
});

const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

export default upload;
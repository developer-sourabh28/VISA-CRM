// upload.js - Fixed GridFS configuration
import { GridFsStorage } from 'multer-gridfs-storage';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

const storage = new GridFsStorage({
    url: process.env.MONGO_URI,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            try {
                const filename = `${Date.now()}-${file.originalname}`;
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads'
                };
                console.log('GridFS fileInfo:', fileInfo);
                resolve(fileInfo);
            } catch (err) {
                console.error('Error in GridFS file function:', err);
                reject(err);
            }
        });
    }
});

// Event listeners for debugging
storage.on('connection', (db) => {
    console.log('✅ GridFS connection established via url');
});

storage.on('file', (file) => {
    console.log('✅ File uploaded to GridFS:', file ? file.filename : 'file object undefined');
});

storage.on('error', (error) => {
    console.error('❌ GridFS storage error:', error);
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        // You can add more specific file type checks if needed
        if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and image files are allowed'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

export default upload;
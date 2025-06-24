import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

let bucket;

// Initialize GridFS bucket with the new bucket name
export const initGridFS = () => {
  try {
    const db = mongoose.connection.db;
    bucket = new GridFSBucket(db, {
      bucketName: 'uploads'  // Match the bucket name from upload.js
    });
    console.log('GridFS bucket initialized successfully');
  } catch (error) {
    console.error('Error initializing GridFS bucket:', error);
    throw error;
  }
};

// Upload file to GridFS with better error handling
export const uploadToGridFS = async (file) => {
  try {
    if (!bucket) {
      initGridFS();
    }

    return new Promise((resolve, reject) => {
      const uploadStream = bucket.openUploadStream(file.originalname, {
        metadata: {
          contentType: file.mimetype,
          uploadDate: new Date()
        }
      });

      uploadStream.on('finish', (file) => {
        resolve(file._id.toString());
      });

      uploadStream.on('error', (error) => {
        console.error('Error in upload stream:', error);
        reject(error);
      });

      uploadStream.end(file.buffer);
    });
  } catch (error) {
    console.error('Error in uploadToGridFS:', error);
    throw error;
  }
};

// Get file from GridFS with better error handling
export const getFileFromGridFS = async (fileId) => {
  try {
    if (!bucket) {
      initGridFS();
    }

    const files = await bucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
    if (!files || files.length === 0) {
      throw new Error('File not found');
    }

    const file = files[0];
    const downloadStream = bucket.openDownloadStream(file._id);
    
    return {
      stream: downloadStream,
      metadata: {
        filename: file.filename,
        contentType: file.metadata?.contentType || 'application/octet-stream',
        length: file.length
      }
    };
  } catch (error) {
    console.error('Error in getFileFromGridFS:', error);
    throw error;
  }
};

// Delete file from GridFS with better error handling
export const deleteFileFromGridFS = async (fileId) => {
  try {
    if (!bucket) {
      initGridFS();
    }

    await bucket.delete(new mongoose.Types.ObjectId(fileId));
    console.log('File deleted successfully:', fileId);
  } catch (error) {
    console.error('Error in deleteFileFromGridFS:', error);
    throw error;
  }
};

// Get file by filename with better error handling
export const getFileStreamByFilename = async (filename) => {
  try {
    if (!bucket) {
      initGridFS();
    }
    
    const files = await bucket.find({ filename: filename }).toArray();
    if (!files || files.length === 0) {
      throw new Error(`File not found: ${filename}`);
    }

    const file = files[0];
    const downloadStream = bucket.openDownloadStream(file._id);

    return {
      stream: downloadStream,
      metadata: {
        filename: file.filename,
        contentType: file.metadata?.contentType || 'application/octet-stream',
        length: file.length
      }
    };
  } catch (error) {
    console.error('Error in getFileStreamByFilename:', error);
    throw error;
  }
}; 
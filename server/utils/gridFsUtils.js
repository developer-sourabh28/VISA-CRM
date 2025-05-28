import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

let bucket;

// Initialize GridFS bucket
export const initGridFS = () => {
  const db = mongoose.connection.db;
  bucket = new GridFSBucket(db, {
    bucketName: 'uploads'
  });
};

// Upload file to GridFS
export const uploadToGridFS = async (file) => {
  if (!bucket) {
    initGridFS();
  }

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(file.originalname, {
      metadata: {
        contentType: file.mimetype
      }
    });

    uploadStream.on('finish', (file) => {
      resolve(file._id.toString());
    });

    uploadStream.on('error', (error) => {
      reject(error);
    });

    uploadStream.end(file.buffer);
  });
};

// Get file from GridFS
export const getFileFromGridFS = async (fileId) => {
  if (!bucket) {
    initGridFS();
  }

  try {
    const files = await bucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
    if (files.length === 0) {
      throw new Error('File not found');
    }

    const file = files[0];
    const downloadStream = bucket.openDownloadStream(file._id);
    
    return {
      stream: downloadStream,
      metadata: {
        filename: file.filename,
        contentType: file.metadata.contentType,
        length: file.length
      }
    };
  } catch (error) {
    throw error;
  }
};

// Delete file from GridFS
export const deleteFileFromGridFS = async (fileId) => {
  if (!bucket) {
    initGridFS();
  }

  try {
    await bucket.delete(new mongoose.Types.ObjectId(fileId));
  } catch (error) {
    throw error;
  }
}; 
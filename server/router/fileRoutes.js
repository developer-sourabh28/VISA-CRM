import express from 'express';
import { getFileFromGridFS, getFileStreamByFilename } from '../utils/gridFsUtils.js';
import { isAuthenticated } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get file by filename
router.get('/name/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const file = await getFileStreamByFilename(filename);

    res.set({
      'Content-Type': file.metadata.contentType,
      'Content-Length': file.metadata.length,
      'Content-Disposition': `inline; filename="${file.metadata.filename}"`
    });

    file.stream.pipe(res);
  } catch (error) {
    res.status(404).json({ message: 'File not found' });
  }
});

// Get file by ID
router.get('/:fileId', isAuthenticated, async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await getFileFromGridFS(fileId);

    // Set appropriate headers
    res.set({
      'Content-Type': file.metadata.contentType,
      'Content-Length': file.metadata.length,
      'Content-Disposition': `inline; filename="${file.metadata.filename}"`
    });

    // Pipe the file stream to the response
    file.stream.pipe(res);
  } catch (error) {
    res.status(404).json({ message: 'File not found' });
  }
});

export default router; 
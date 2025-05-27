import express from 'express';
import { getFileFromGridFS } from '../utils/gridFsUtils.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get file by ID
router.get('/:fileId', authenticateToken, async (req, res) => {
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
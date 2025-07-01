import express from 'express';
import Message from '../models/Message.js';
import User from '../models/User.js';

const router = express.Router();

// Get all messages
router.get('/', async (req, res) => {
  try {
    const messages = await Message.find()
      .sort({ timestamp: 1 })
      .limit(50);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// Get private messages between two users
router.get('/private/:userId/:recipientId', async (req, res) => {
  try {
    const { userId, recipientId } = req.params;
    const messages = await Message.find({
      isPrivate: true,
      $or: [
        { userId, recipientId },
        { userId: recipientId, recipientId: userId }
      ]
    }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching private messages' });
  }
});

// Create a new message
router.post('/', async (req, res) => {
  try {
    const { content, userId, username, recipientId, isPrivate } = req.body;
    if (!content || !userId || !username) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const message = new Message({
      content,
      userId,
      username,
      recipientId: recipientId || null,
      isPrivate: !!recipientId || !!isPrivate,
      timestamp: new Date(),
    });
    await message.save();
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Error creating message' });
  }
});

// Delete a message
router.delete('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body; // The user ID of the person trying to delete

    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if the user is the owner of the message
    if (message.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await Message.findByIdAndDelete(messageId);
    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting message' });
  }
});

// Get all users (for user list)
router.get('/users/all', async (req, res) => {
  try {
    const users = await User.find({}, '_id fullName email username profileImage isActive');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

export default router; 
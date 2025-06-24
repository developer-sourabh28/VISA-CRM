import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  recipientId: {
    type: String,
    required: false, // Only required for private messages
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
});

export default mongoose.model('Message', messageSchema); 
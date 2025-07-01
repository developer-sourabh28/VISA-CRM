import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/VisaCrm';

async function dropEmailIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the database instance
    const db = mongoose.connection.db;
    
    // Drop the unique index on email field
    const result = await db.collection('clients').dropIndex('email_1');
    console.log('Successfully dropped email unique index:', result);
    
    // List remaining indexes to verify
    const indexes = await db.collection('clients').indexes();
    console.log('Remaining indexes:', indexes.map(idx => idx.name));
    
  } catch (error) {
    if (error.code === 26) {
      console.log('Index "email_1" does not exist, which is fine.');
    } else {
      console.error('Error dropping index:', error);
    }
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
dropEmailIndex(); 
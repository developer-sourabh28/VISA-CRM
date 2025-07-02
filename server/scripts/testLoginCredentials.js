import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const testLoginCredentials = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://rohhhh0909:dbpassword@cluster0.2dkkpqi.mongodb.net/VisaCrm');
    console.log('Connected to MongoDB');

    // Get email and password from command line
    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
      console.error('Please provide both email and password');
      process.exit(1);
    }

    // Get the user directly from the database
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.error(`No user found with email: ${email}`);
      process.exit(1);
    }

    console.log('User found:');
    console.log('- ID:', user._id);
    console.log('- Email:', user.email);
    console.log('- Role:', user.role);
    console.log('- Password in database:', user.password);

    // Test the password comparison directly
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('\nDirect password comparison result:', isMatch ? 'MATCH' : 'NO MATCH');

    // Test using the model's compare method
    const modelMatch = await user.comparePassword(password);
    console.log('Model comparePassword result:', modelMatch ? 'MATCH' : 'NO MATCH');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testLoginCredentials(); 
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const testLoginCredentials = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://rohhhh0909:dbpassword@cluster0.2dkkpqi.mongodb.net/VisaCrm');
    console.log('Connected to MongoDB');

    const email = process.argv[2] || 'admin@visa-crm.com';
    const password = process.argv[3] || 'admin123';

    // Find the user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log(`No user found with email: ${email}`);
      process.exit(1);
    }

    console.log('User found:');
    console.log(`- ID: ${user._id}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Role: ${user.role}`);
    console.log(`- Password hash: ${user.password.slice(0, 10)}...`);

    // Direct password comparison
    const directMatch = await bcrypt.compare(password, user.password);
    console.log('\nDirect password comparison result:', directMatch ? 'MATCH' : 'NO MATCH');
    
    console.log('Password comparison debug:');
    console.log('- Stored password starts with $2:', user.password.startsWith('$2'));
    console.log('- Stored password type:', typeof user.password);
    console.log('- Stored password length:', user.password.length);
    console.log('- Candidate password length:', password.length);
    console.log('- bcrypt.compare result:', directMatch);
    
    // Model method comparison
    const modelMatch = await user.comparePassword(password);
    console.log('\nModel comparePassword result:', modelMatch ? 'MATCH' : 'NO MATCH');
    
    // Create a new admin with known credentials if no match
    if (!directMatch) {
      console.log('\nPassword does not match. Do you want to reset the password? (y/n)');
      process.stdin.once('data', async (data) => {
        const answer = data.toString().trim().toLowerCase();
        if (answer === 'y' || answer === 'yes') {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(password, salt);
          await user.save();
          console.log(`Password reset for ${email}`);
          console.log('New password hash:', user.password.slice(0, 10) + '...');
        }
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testLoginCredentials(); 
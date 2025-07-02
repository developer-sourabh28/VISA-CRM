import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const directPasswordSet = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://rohhhh0909:dbpassword@cluster0.2dkkpqi.mongodb.net/VisaCrm');
    console.log('Connected to MongoDB');

    // Get email and new password from command line
    const email = process.argv[2];
    const newPassword = process.argv[3] || 'password123';

    if (!email) {
      console.error('Please provide an email address');
      process.exit(1);
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Directly update the password in the database
    const result = await mongoose.connection.collection('teammembers').updateOne(
      { email },
      { $set: { password: hashedPassword } }
    );

    if (result.matchedCount === 0) {
      console.error(`No user found with email: ${email}`);
      process.exit(1);
    }

    console.log(`Password directly set for ${email}`);
    console.log(`New password: ${newPassword}`);
    console.log(`Matched count: ${result.matchedCount}, Modified count: ${result.modifiedCount}`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

directPasswordSet(); 
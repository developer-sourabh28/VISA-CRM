import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import Role from '../models/settings/Role.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const createSimpleUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://rohhhh0909:dbpassword@cluster0.2dkkpqi.mongodb.net/VisaCrm');
    console.log('Connected to MongoDB');

    // Find or create admin role
    let adminRole = await Role.findOne({ name: 'Admin' });
    if (!adminRole) {
      console.log('Admin role not found, creating...');
      adminRole = await Role.create({
        name: 'Admin',
        description: 'Administrator with full access',
        permissions: {
          dashboard: { components: ['all'] },
          enquiries: ['view', 'create', 'edit', 'delete'],
          clients: ['view', 'create', 'edit', 'delete']
        }
      });
    }

    // Create test user directly in the database
    const email = 'test@visacrm.com';
    const password = 'test123';
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Check if user already exists
    const existingUser = await mongoose.connection.collection('teammembers').findOne({ email });
    if (existingUser) {
      // Update the user's password
      await mongoose.connection.collection('teammembers').updateOne(
        { email },
        { 
          $set: { 
            password: hashedPassword,
            roleId: adminRole._id
          } 
        }
      );
      console.log(`Updated test user: ${email} with password: ${password}`);
    } else {
      // Create new user
      await mongoose.connection.collection('teammembers').insertOne({
        fullName: 'Test User',
        email,
        username: 'testuser',
        password: hashedPassword,
        role: 'Admin',
        roleId: adminRole._id,
        branch: 'Main Office',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Created test user: ${email} with password: ${password}`);
    }

    console.log('Test user ready for login');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createSimpleUser(); 
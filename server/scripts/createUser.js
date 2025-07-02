import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Role from '../models/settings/Role.js';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const createUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://rohhhh0909:dbpassword@cluster0.2dkkpqi.mongodb.net/VisaCrm');
    console.log('Connected to MongoDB');

    // Get or create admin role
    let adminRole = await Role.findOne({ name: 'Admin' });
    
    if (!adminRole) {
      console.log('Admin role not found, creating...');
      
      adminRole = await Role.create({
        name: 'Admin',
        description: 'Administrator with full access',
        permissions: {
          dashboard: { components: ['all'] },
          enquiries: ['view', 'create', 'edit', 'delete'],
          clients: ['view', 'create', 'edit', 'delete'],
          appointments: ['view', 'create', 'edit', 'delete'],
          deadlines: ['view', 'create', 'edit', 'delete'],
          quickInvoice: ['view', 'create', 'edit', 'delete'],
          reports: ['view', 'create', 'edit', 'delete'],
          reminders: ['view', 'create', 'edit', 'delete'],
          settings: ['view', 'create', 'edit', 'delete']
        }
      });
      
      console.log('Admin role created with ID:', adminRole._id);
    }

    // Create new user
    const email = process.argv[2] || 'newuser@visacrm.com';
    const password = process.argv[3] || 'password123';
    const fullName = process.argv[4] || 'New User';
    const username = process.argv[5] || email.split('@')[0];
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`User with email ${email} already exists. Skipping creation.`);
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = await User.create({
      fullName,
      email,
      username,
      password: hashedPassword,
      role: 'Admin',
      roleId: adminRole._id,
      branch: 'Main Office',
      isActive: true,
      permissions: {
        // Copy permissions from admin role or set as needed
      }
    });

    console.log(`New user created: ${email} with password: ${password}`);
    console.log('User details:', {
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      role: user.role,
      roleId: user.roleId
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createUser(); 
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Role from '../models/settings/Role.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const createAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://rohhhh0909:dbpassword@cluster0.2dkkpqi.mongodb.net/VisaCrm');
    console.log('Connected to MongoDB');

    // Email and password for the new admin
    const email = 'admin@visa-crm.com';
    const password = 'admin123';
    const username = 'admin';
    const fullName = 'Super Admin';

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      console.log(`User with email ${email} already exists. Updating password...`);
      
      // Directly update the password without using the model's pre-save hook
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      await User.updateOne(
        { email },
        { $set: { password: hashedPassword } }
      );
      
      console.log('Password updated successfully.');
      
      // Test the password immediately
      const updatedUser = await User.findOne({ email }).select('+password');
      const match = await bcrypt.compare(password, updatedUser.password);
      console.log('Password verification:', match ? 'SUCCESSFUL' : 'FAILED');
      
      process.exit(0);
    }

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
    } else {
      console.log('Admin role found with ID:', adminRole._id);
    }

    // Hash password manually (not using the model's pre-save hook)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the admin user
    const newAdmin = await User.create({
      fullName,
      email,
      username,
      password: hashedPassword,
      role: 'Admin',
      roleId: adminRole._id,
      branch: 'Main Office',
      isActive: true
    });

    console.log('Admin user created successfully:');
    console.log('- ID:', newAdmin._id);
    console.log('- Email:', newAdmin.email);
    console.log('- Username:', newAdmin.username);
    console.log('- Role:', newAdmin.role);

    // Test the password immediately
    const createdUser = await User.findOne({ email }).select('+password');
    const match = await bcrypt.compare(password, createdUser.password);
    console.log('Password verification:', match ? 'SUCCESSFUL' : 'FAILED');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createAdminUser(); 
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Role from '../models/settings/Role.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const createDefaultRoleAndFixAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://rohhhh0909:dbpassword@cluster0.2dkkpqi.mongodb.net/VisaCrm');
    console.log('Connected to MongoDB');

    // Check if admin role exists, create if not
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
      console.log('Admin role already exists with ID:', adminRole._id);
    }

    // Find admin user and update roleId
    const email = process.argv[2] || 'admin@visacrm.com'; // Default to admin@visacrm.com if no email provided
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`User with email ${email} not found`);
      process.exit(1);
    }
    
    user.roleId = adminRole._id;
    
    // Ensure role is set to 'Admin'
    if (user.role !== 'Admin') {
      user.role = 'Admin';
    }
    
    await user.save();
    console.log(`User ${email} has been updated with admin role ID`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createDefaultRoleAndFixAdmin(); 
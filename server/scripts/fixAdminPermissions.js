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

const fixAdminPermissions = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://rohhhh0909:dbpassword@cluster0.2dkkpqi.mongodb.net/VisaCrm');
    console.log('Connected to MongoDB');

    // Find the admin user
    const email = 'admin@visa-crm.com';
    const adminUser = await User.findOne({ email });
    
    if (!adminUser) {
      console.log(`No user found with email ${email}`);
      process.exit(1);
    }
    
    console.log('Found admin user:', adminUser.email, 'with role:', adminUser.role);
    
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
    
    // Update admin permissions
    const fullPermissions = {
      // Legacy permissions - set everything to true
      dashboard: true,
      enquiries: true,
      clients: true,
      appointments: true,
      deadlines: true,
      payments: true,
      reports: true,
      reminders: true,
      settings: true,
      // Add any other modules you need access to
      visa_tracker: true,
      agreements: true,
      documents: true
    };
    
    // Update the user with permissions and roleId
    const updatedUser = await User.findByIdAndUpdate(
      adminUser._id,
      { 
        permissions: fullPermissions,
        roleId: adminRole._id,
        role: 'Admin' // Ensure role is 'Admin' with capital A
      },
      { new: true }
    );
    
    console.log('Admin user updated successfully:');
    console.log('- ID:', updatedUser._id);
    console.log('- Email:', updatedUser.email);
    console.log('- Role:', updatedUser.role);
    console.log('- RoleId:', updatedUser.roleId);
    console.log('- Permissions:', JSON.stringify(updatedUser.permissions, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixAdminPermissions(); 
import User from '../models/User.js';
import Role from '../models/settings/Role.js';
import bcrypt from 'bcryptjs';

/**
 * @desc    Test endpoint
 * @route   GET /api/admin/test
 * @access  Public
 */
export const testEndpoint = (req, res) => {
  res.status(200).json({ message: 'Admin routes working' });
};

/**
 * @desc    Initialize default admin user
 * @route   POST /api/admin/init
 * @access  Public
 */
export const initAdmin = async (req, res) => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ role: 'Admin' });
    
    if (adminExists) {
      return res.status(400).json({ 
        success: false,
        message: 'Admin already exists' 
      });
    }

    // Find or create admin role
    let adminRole = await Role.findOne({ name: 'Admin' });
    
    if (!adminRole) {
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
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Create admin user
    const admin = await User.create({
      fullName: 'Super Admin',
      email: 'admin@visa-crm.com',
      username: 'admin',
      password: hashedPassword,
      role: 'Admin',
      roleId: adminRole._id,
      branch: 'Main Office',
      isActive: true,
      permissions: {
        // Full admin permissions
      }
    });

    res.status(201).json({
      success: true,
      message: 'Admin created',
      email: admin.email
    });
  } catch (error) {
    console.error('Error initializing admin:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
}; 
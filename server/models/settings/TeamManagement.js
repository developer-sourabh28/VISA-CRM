import mongoose from 'mongoose';

// Module permission schema
const modulePermissionSchema = new mongoose.Schema({
  view: { type: Boolean, default: false },
  edit: { type: Boolean, default: false }
}, { _id: false });

// For custom permission overrides
const customPermissionsSchema = new mongoose.Schema({
  // Dashboard access permission
  dashboard: { type: Boolean, default: false },
  
  // Module-specific permissions
  modules: {
    enquiries: { type: modulePermissionSchema, default: () => ({}) },
    clients: { type: modulePermissionSchema, default: () => ({}) },
    appointments: { type: modulePermissionSchema, default: () => ({}) },
    deadlines: { type: modulePermissionSchema, default: () => ({}) },
    payments: { type: modulePermissionSchema, default: () => ({}) },
    reports: { type: modulePermissionSchema, default: () => ({}) },
    settings: { type: modulePermissionSchema, default: () => ({}) },
    reminders: { type: modulePermissionSchema, default: () => ({}) }
  }
}, { _id: false });

// We no longer need the permissions schema since permissions are now role-based
const teamMemberSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  // Role name for display purposes
  role: String,
  // Reference to the actual Role document
  roleId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Role',
    required: true
  },
  // Employee ID field 
  employeeId: { 
    type: String,
    unique: true, // Make it unique
    sparse: true  // Allow multiple null values (for backwards compatibility)
  },
  branch: String,
  branchId: String,
  username: String,
  password: String,
  isActive: { type: Boolean, default: true },
  // Flag to determine if custom permissions should override role permissions
  useCustomPermissions: { type: Boolean, default: false },
  // Custom permission overrides
  customPermissions: {
    type: customPermissionsSchema,
    default: () => ({})
  },
  notes: String,
}, { timestamps: true });

// Helper function to generate a new employee ID
async function getNextSequentialEmployeeId() {
  // Find the highest existing employee ID
  const highestTeamMember = await mongoose.model('TeamMember').findOne({
    employeeId: { $regex: /^EMP\d{6}$/ }
  })
  .sort({ employeeId: -1 })
  .limit(1);
  
  let nextNum = 1;
  if (highestTeamMember && highestTeamMember.employeeId) {
    const match = highestTeamMember.employeeId.match(/^EMP(\d{6})$/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }
  
  return `EMP${nextNum.toString().padStart(6, '0')}`;
}

// Pre-save hook to ensure employeeId is set
teamMemberSchema.pre('save', async function(next) {
  if (!this.employeeId) {
    try {
      this.employeeId = await getNextSequentialEmployeeId();
    } catch (err) {
      // In case of error, generate a simple ID based on timestamp
      const timestamp = Date.now() % 1000000;
      this.employeeId = `EMP${timestamp.toString().padStart(6, '0')}`;
    }
  }
  next();
});

const TeamMember = mongoose.model('TeamMember', teamMemberSchema);
export default TeamMember;

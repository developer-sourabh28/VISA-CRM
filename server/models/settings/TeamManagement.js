import mongoose from 'mongoose';

const permissionsSchema = new mongoose.Schema({
  dashboard: Boolean,
  enquiries: Boolean,
  clients: Boolean,
  agreements: Boolean,
  appointments: Boolean,
  deadlines: Boolean,
  payments: Boolean,
  reports: Boolean,
  settings: Boolean,
  reminder: Boolean,
}, { _id: false });

const teamMemberSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  role: String,
  branch: String,
  username: String,
  password: String,
  isActive: Boolean,
  permissions: permissionsSchema,
  notes: String,
}, { timestamps: true });

const TeamMember = mongoose.model('TeamMember', teamMemberSchema);
export default TeamMember;

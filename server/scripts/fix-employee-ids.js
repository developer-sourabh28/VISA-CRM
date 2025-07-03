// Manual script to fix employee IDs
// Run with: node fix-employee-ids.js

import mongoose from 'mongoose';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __dirname = dirname(fileURLToPath(import.meta.url));

// Define the TeamMember schema directly in this script
const teamMemberSchema = new mongoose.Schema({
  fullName: String, 
  email: String,
  employeeId: String,
  role: String,
  roleId: mongoose.Schema.Types.ObjectId,
}, { 
  collection: 'teammembers',
  timestamps: true 
});

async function run() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/visa-crm');
    console.log('Connected to MongoDB');
    
    // Register the model
    const TeamMember = mongoose.model('TeamMember', teamMemberSchema);
    
    // Get all team members
    const teamMembers = await TeamMember.find({});
    console.log(`Found ${teamMembers.length} team members`);
    
    // Update team members without employee IDs
    let counter = 0;
    for (let i = 0; i < teamMembers.length; i++) {
      const member = teamMembers[i];
      
      if (!member.employeeId) {
        const empId = `EMP${(i + 1).toString().padStart(6, '0')}`;
        await TeamMember.updateOne(
          { _id: member._id },
          { $set: { employeeId: empId } }
        );
        console.log(`Updated ${member.fullName || member.email || 'Unknown'} with ID: ${empId}`);
        counter++;
      }
    }
    
    console.log(`Updated ${counter} team members`);
    
  } catch (error) {
    console.error('Error fixing employee IDs:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    process.exit(0);
  }
}

run(); 
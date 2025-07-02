/**
 * This script updates all team members to ensure they have valid employee IDs.
 * It generates sequential 6-digit employee IDs for any team member that doesn't have one.
 */

// Set up MongoDB connection
const mongoose = require('mongoose');
const teamMemberSchema = require('../models/settings/TeamManagement').schema;
const TeamMember = mongoose.model('TeamMember', teamMemberSchema);

// Connect to MongoDB using the connection string from environment
mongoose.connect('mongodb://localhost:27017/visa-crm')
  .then(() => {
    console.log('MongoDB connected');
    updateEmployeeIds();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Function to generate a new employee ID
function generateEmployeeId(index) {
  return `EMP${(index + 1).toString().padStart(6, '0')}`;
}

// Main function to update employee IDs
async function updateEmployeeIds() {
  try {
    // Get all team members
    const teamMembers = await TeamMember.find().sort({ createdAt: 1 });
    console.log(`Found ${teamMembers.length} total team members`);
    
    // Filter those without proper employee IDs
    const membersToUpdate = teamMembers.filter(member => {
      return !member.employeeId || member.employeeId === 'N/A';
    });
    
    console.log(`Found ${membersToUpdate.length} team members without proper employee IDs`);
    
    // Update each member with a new employee ID
    let updateCount = 0;
    for (let i = 0; i < membersToUpdate.length; i++) {
      const member = membersToUpdate[i];
      const employeeId = generateEmployeeId(teamMembers.length + i);
      
      await TeamMember.updateOne(
        { _id: member._id },
        { $set: { employeeId } }
      );
      
      console.log(`Updated ${member.fullName || 'Unknown'} with new ID: ${employeeId}`);
      updateCount++;
    }
    
    console.log(`Successfully updated ${updateCount} team members`);
  } catch (err) {
    console.error('Error updating employee IDs:', err);
  } finally {
    mongoose.disconnect();
    console.log('MongoDB disconnected');
    process.exit(0);
  }
} 
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Load the TeamMember model
const TeamMember = require('../models/settings/TeamManagement');

// Function to generate sequential employee IDs
function generateEmployeeId(index) {
  // Start from 1 and add the index (makes it more human-friendly)
  const numericPart = index + 1;
  // Format with leading zeros to 6 digits
  return `EMP${numericPart.toString().padStart(6, '0')}`;
}

async function updateEmployeeIds() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/visa-crm');
    console.log('MongoDB connected...');
    
    // Get all team members without employee IDs
    const teamMembers = await TeamMember.find({ $or: [
      { employeeId: { $exists: false } },
      { employeeId: null },
      { employeeId: '' }
    ]}).sort({ createdAt: 1 });
    
    console.log(`Found ${teamMembers.length} team members without employee IDs`);
    
    // Update each team member with a sequential employee ID
    for (let i = 0; i < teamMembers.length; i++) {
      const member = teamMembers[i];
      const employeeId = generateEmployeeId(i);
      
      await TeamMember.updateOne(
        { _id: member._id },
        { $set: { employeeId } }
      );
      
      console.log(`Updated ${member.fullName} with employee ID: ${employeeId}`);
    }
    
    console.log('Employee ID update completed successfully!');
  } catch (error) {
    console.error('Error updating employee IDs:', error);
  } finally {
    // Close the connection
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
    process.exit(0);
  }
}

// Run the function
updateEmployeeIds(); 
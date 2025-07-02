import TeamMember from '../../models/settings/TeamManagement.js';

// Helper function to get the next available employee ID
async function getNextEmployeeId() {
  try {
    // First try to find the highest existing employee ID
    const teamMember = await TeamMember.findOne({ 
      employeeId: { $regex: /^EMP\d{6}$/ } 
    })
    .sort({ employeeId: -1 }) // Sort in descending order to get the highest ID
    .limit(1);
    
    if (teamMember && teamMember.employeeId) {
      // Extract the numeric part and increment it
      const numericPart = parseInt(teamMember.employeeId.substring(3), 10);
      if (!isNaN(numericPart)) {
        const nextNumeric = numericPart + 1;
        // Format with leading zeros
        return `EMP${nextNumeric.toString().padStart(6, '0')}`;
      }
    }
    
    // Alternative approach if no proper pattern found:
    // Count all members and use that as a base
    const count = await TeamMember.countDocuments({});
    return `EMP${(count + 1).toString().padStart(6, '0')}`;
  } catch (error) {
    console.error('Error generating employee ID:', error);
    // In case of error, generate a random ID based on timestamp
    const timestamp = Date.now().toString().slice(-6);
    return `EMP${timestamp.padStart(6, '0')}`;
  }
}

export const getAll = async (req, res) => {
  try {
    const { branchId } = req.query;
    const query = branchId && branchId !== 'all' ? { branchId } : {};
    const members = await TeamMember.find(query);
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const create = async (req, res) => {
  try {
    // Validate that we have both role name and roleId
    if (!req.body.roleId) {
      return res.status(400).json({ error: 'Role ID is required' });
    }
    
    // Always generate a new employee ID, even if database query fails
    let employeeId;
    try {
      // Try to get the next available employee ID
      employeeId = await getNextEmployeeId();
    } catch (error) {
      console.error('Failed to get sequential employee ID, using timestamp fallback:', error);
      // Fallback to using timestamp-based ID if database query fails
      const timestamp = Date.now();
      employeeId = `EMP${timestamp.toString().slice(-6).padStart(6, '0')}`;
    }
    
    // Ensure proper data structure for custom permissions
    const memberData = {
      ...req.body,
      employeeId,
      // Only include custom permissions if override is enabled
      customPermissions: req.body.useCustomPermissions ? req.body.customPermissions : {},
    };

    const member = new TeamMember(memberData);
    await member.save();
    res.status(201).json(member);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await TeamMember.findByIdAndDelete(id);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    } 
    res.status(200).json({ message: 'Member deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export const updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate that we have both role name and roleId
    if (!req.body.roleId) {
      return res.status(400).json({ error: 'Role ID is required' });
    }
    
    // Ensure proper data structure for custom permissions
    const updatedData = {
      ...req.body,
      // Only include custom permissions if override is enabled
      customPermissions: req.body.useCustomPermissions ? req.body.customPermissions : {},
    };

    const member = await TeamMember.findByIdAndUpdate(id, updatedData, { new: true });
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.status(200).json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

import Role from '../../models/settings/Role.js';

export const getAll = async (req, res) => {
  try {
    const roles = await Role.find().sort({ name: 1 });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const create = async (req, res) => {
  try {
    console.log('Creating role with data:', JSON.stringify(req.body, null, 2));
    
    // Validate required fields
    if (!req.body.name) {
      return res.status(400).json({ error: 'Role name is required' });
    }
    
    // Handle permissions data, which could be in various formats
    let permissions = {};
    
    if (req.body.permissions) {
      // If permissions is a string (happens with some middleware), try to parse it
      if (typeof req.body.permissions === 'string') {
        try {
          permissions = JSON.parse(req.body.permissions);
        } catch (parseErr) {
          console.error('Error parsing permissions string:', parseErr);
          
          // If it's an array-like string representation, handle it specially
          if (req.body.permissions.startsWith('[') && req.body.permissions.endsWith(']')) {
            try {
              // Try to eval the string to get the object (dangerous but controlled input)
              // eslint-disable-next-line no-eval
              const tempObj = eval(req.body.permissions);
              if (Array.isArray(tempObj) && tempObj.length > 0) {
                permissions = tempObj[0];
              }
            } catch (evalErr) {
              console.error('Error evaluating permissions string:', evalErr);
            }
          }
        }
      } 
      // If it's an array with one object, extract the object
      else if (Array.isArray(req.body.permissions) && req.body.permissions.length > 0) {
        permissions = req.body.permissions[0];
      }
      // If it's already an object, use it directly
      else if (typeof req.body.permissions === 'object') {
        permissions = req.body.permissions;
      }
    }
    
    // Ensure default structure if anything is missing
    if (!permissions.dashboard || typeof permissions.dashboard !== 'object') {
      permissions.dashboard = { components: [] };
    } else if (!permissions.dashboard.components) {
      permissions.dashboard.components = [];
    }
    
    // Ensure all expected permission arrays exist
    const expectedModules = [
      'enquiries', 'clients', 'appointments', 'deadlines', 
      'quickInvoice', 'reports', 'reminders', 'settings'
    ];
    
    expectedModules.forEach(module => {
      if (!Array.isArray(permissions[module])) {
        permissions[module] = [];
      }
    });
    
    // Create role with clean data structure
    const roleData = {
      name: req.body.name,
      description: req.body.description || '',
      permissions
    };
    
    console.log('Processed role data:', JSON.stringify(roleData, null, 2));
    
    const role = new Role(roleData);
    await role.save();
    
    console.log('Role created successfully:', role);
    res.status(201).json(role);
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(400).json({ error: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Updating role with ID:', id);
    console.log('Update data:', JSON.stringify(req.body, null, 2));
    
    // Validate required fields
    if (!req.body.name) {
      return res.status(400).json({ error: 'Role name is required' });
    }
    
    // Handle permissions data, which could be in various formats
    let permissions = {};
    
    if (req.body.permissions) {
      // If permissions is a string (happens with some middleware), try to parse it
      if (typeof req.body.permissions === 'string') {
        try {
          permissions = JSON.parse(req.body.permissions);
        } catch (parseErr) {
          console.error('Error parsing permissions string:', parseErr);
          
          // If it's an array-like string representation, handle it specially
          if (req.body.permissions.startsWith('[') && req.body.permissions.endsWith(']')) {
            try {
              // Try to eval the string to get the object (dangerous but controlled input)
              // eslint-disable-next-line no-eval
              const tempObj = eval(req.body.permissions);
              if (Array.isArray(tempObj) && tempObj.length > 0) {
                permissions = tempObj[0];
              }
            } catch (evalErr) {
              console.error('Error evaluating permissions string:', evalErr);
            }
          }
        }
      } 
      // If it's an array with one object, extract the object
      else if (Array.isArray(req.body.permissions) && req.body.permissions.length > 0) {
        permissions = req.body.permissions[0];
      }
      // If it's already an object, use it directly
      else if (typeof req.body.permissions === 'object') {
        permissions = req.body.permissions;
      }
    }
    
    // Ensure default structure if anything is missing
    if (!permissions.dashboard || typeof permissions.dashboard !== 'object') {
      permissions.dashboard = { components: [] };
    } else if (!permissions.dashboard.components) {
      permissions.dashboard.components = [];
    }
    
    // Ensure all expected permission arrays exist
    const expectedModules = [
      'enquiries', 'clients', 'appointments', 'deadlines', 
      'quickInvoice', 'reports', 'reminders', 'settings'
    ];
    
    expectedModules.forEach(module => {
      if (!Array.isArray(permissions[module])) {
        permissions[module] = [];
      }
    });
    
    // Update role with clean data structure
    const roleData = {
      name: req.body.name,
      description: req.body.description || '',
      permissions
    };
    
    console.log('Processed role update data:', JSON.stringify(roleData, null, 2));
    
    const role = await Role.findByIdAndUpdate(id, roleData, { new: true });
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    console.log('Role updated successfully:', role);
    res.json(role);
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(400).json({ error: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findByIdAndDelete(id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.json(role);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 
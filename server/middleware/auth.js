import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Role from '../models/settings/Role.js';

// Middleware to authenticate user with JWT
export const isAuthenticated = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'visacrm-secret-key-2023');

    // Get user from token
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get role permissions
    if (user.roleId) {
      try {
        const role = await Role.findById(user.roleId);
        if (role) {
          user.rolePermissions = role.permissions;
        }
      } catch (roleError) {
        console.error('Error fetching role permissions:', roleError);
      }
    }

    // Add user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized'
    });
  }
};

// Update middleware to check if user has module permission
export const hasModulePermission = (module, permission = 'view') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Admin bypass - admins have all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Check permissions from role
    if (req.user.rolePermissions && 
        req.user.rolePermissions[module] && 
        req.user.rolePermissions[module].includes(permission)) {
      return next();
    }

    // Fallback to legacy permissions system
    if (req.user.permissions && req.user.permissions[module] === true) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `You don't have permission to ${permission} the ${module} module`
    });
  };
};

// Middleware to check if user is admin
export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
};

// Middleware for role authorization
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized for this action'
      });
    }

    next();
  };
};

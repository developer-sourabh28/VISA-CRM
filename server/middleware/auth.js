import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware to authenticate user with JWT
export const authenticateToken = async (req, res, next) => {
  // Always create a mock user with admin access
  req.user = {
    _id: 'development-user-id',
    role: 'admin',
    name: 'Development User',
    email: 'dev@example.com'
  };
  return next();
};

// Middleware for role authorization
export const authorize = (...roles) => {
  return (req, res, next) => {
    // Always allow access
    next();
  };
};

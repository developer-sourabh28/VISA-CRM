import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      try {
        // Get token from header
        token = req.headers.authorization.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from the token
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
          return res.status(401).json({ 
            success: false, 
            message: 'Not authorized, user not found' 
          });
        }

        // Add user and branch info to request
        req.user = {
          id: user._id,
          email: user.email,
          role: user.role,
          branch: user.branch // Include branch in the request
        };

        next();
      } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ 
          success: false, 
          message: 'Not authorized, token failed' 
        });
      }
    }

    if (!token) {
      res.status(401).json({ 
        success: false, 
        message: 'Not authorized, no token' 
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Not authorized' 
    });
  }
}; 
import Deadline from "../models/Deadline.js";
import mongoose from "mongoose";
import Branch from "../models/Branch.js";
import User from "../models/User.js";

// Create a new deadline
export const createDeadline = async (req, res) => {
  try {
    console.log('Request user from token:', req.user); // Debug log

    // Get the user's branch from the token payload
    const userBranch = req.user.branch;
    if (!userBranch) {
      console.log('No branch found in token for user:', req.user.email); // Debug log
      return res.status(400).json({ 
        success: false, 
        message: 'User branch not found in token. Please log out and log in again.' 
      });
    }

    console.log('User branch from token:', userBranch); // Debug log

    // Get the branch details using branch name
    const branch = await Branch.findOne({ branchName: userBranch });
    if (!branch) {
      console.log('Branch not found in database:', userBranch); // Debug log
      return res.status(400).json({ 
        success: false, 
        message: 'Branch not found in database. Please contact administrator.' 
      });
    }

    console.log('Found branch:', {
      branchName: branch.branchName,
      branchId: branch.branchId
    }); // Debug log

    // Set the branchId from the branch
    const deadlineData = {
      ...req.body,
      branchId: branch.branchId
    };

    console.log('Creating deadline with data:', deadlineData); // Debug log

    const deadline = await Deadline.create(deadlineData);
    
    // Get branch details for response
    const responseData = {
      ...deadline.toObject(),
      branchId: {
        branchName: branch.branchName,
        branchLocation: branch.branchLocation,
        branchId: branch.branchId
      }
    };
    
    console.log('Created deadline:', responseData); // Debug log
    
    res.status(201).json({ success: true, data: responseData });
  } catch (error) {
    console.error('Error in createDeadline:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all deadlines
export const getDeadlines = async (req, res) => {
  try {
    const filter = {};
    if (req.query.history === "true") filter.history = true;
    else filter.history = { $ne: true };

    if (req.query.branchId && req.query.branchId !== 'all') {
      try {
        // Find the branch by branchId
        const branch = await Branch.findOne({ branchId: req.query.branchId });
        if (branch) {
          filter.branchId = branch.branchId; // Use branchId directly
          console.log('Found branch:', branch.branchName, 'with branchId:', branch.branchId); // Debug log
        } else {
          console.log('No branch found with branchId:', req.query.branchId); // Debug log
          return res.status(400).json({ 
            success: false, 
            message: 'Branch not found' 
          });
        }
      } catch (err) {
        console.error('Error processing branchId in get:', err);
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid branch ID format' 
        });
      }
    }

    console.log('Filter being used:', filter); // Debug log

    const deadlines = await Deadline.find(filter).sort({ dueDate: 1 });
    
    // Get branch details for each deadline
    const deadlinesWithBranchDetails = await Promise.all(
      deadlines.map(async (deadline) => {
        let branchDetails = null;
        if (deadline.branchId) {
          branchDetails = await Branch.findOne({ branchId: deadline.branchId });
        }
        return {
          ...deadline.toObject(),
          branchId: branchDetails ? {
            branchName: branchDetails.branchName,
            branchLocation: branchDetails.branchLocation,
            branchId: branchDetails.branchId
          } : null
        };
      })
    );
    
    console.log('Found deadlines:', deadlinesWithBranchDetails.length); // Debug log
    
    res.json({ success: true, data: deadlinesWithBranchDetails });
  } catch (error) {
    console.error('Error in getDeadlines:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Restore a deadline
export const restoreDeadline = async (req, res) => {
  try {
    const deadline = await Deadline.findByIdAndUpdate(
      req.params.id,
      { history: false },
      { new: true }
    );
    
    if (!deadline) {
      return res.status(404).json({ 
        success: false, 
        message: 'Deadline not found' 
      });
    }

    // Get branch details
    let branchDetails = null;
    if (deadline.branchId) {
      branchDetails = await Branch.findOne({ branchId: deadline.branchId });
    }

    const responseData = {
      ...deadline.toObject(),
      branchId: branchDetails ? {
        branchName: branchDetails.branchName,
        branchLocation: branchDetails.branchLocation,
        branchId: branchDetails.branchId
      } : null
    };
    
    res.json({ success: true, data: responseData });
  } catch (err) {
    console.error('Error in restoreDeadline:', err);
    res.status(400).json({ success: false, error: err.message });
  }
};
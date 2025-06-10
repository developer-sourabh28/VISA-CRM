import Deadline from "../models/Deadline.js";
import mongoose from "mongoose";
import Branch from "../models/Branch.js";
import User from "../models/User.js";


// Create a new deadline
export const createDeadline = async (req, res) => {
  try {
    // Get the user's branch from the token payload
    const userBranch = req.user.branch;
    if (!userBranch) {
      return res.status(400).json({ 
        success: false, 
        message: 'User branch not found in token. Please log out and log in again.' 
      });
    }

    // Get the branch details using branch name
    const branch = await Branch.findOne({ branchName: userBranch });
    if (!branch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Branch not found in database. Please contact administrator.' 
      });
    }

    // Set the branchId from the branch
    const deadlineData = {
      ...req.body,
      branchId: branch.branchId
    };

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
    
    res.status(201).json({ success: true, data: responseData });
  } catch (error) {
    console.error('Error in createDeadline:', error);
    console.error('Error in createDeadline:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all deadlines
export const getDeadlines = async (req, res) => {
  try {
    const filter = {};
    
    // Get user's branch and role from token
    const userBranch = req.user.branch;
    const userRole = req.user.role?.toUpperCase();
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

    if (!userBranch) {
      return res.status(400).json({
        success: false,
        message: 'User branch not found in token'
      });
    }

    // Get branch details
    let userBranchDoc;
    try {
      userBranchDoc = await Branch.findOne({ branchName: userBranch });
      if (!userBranchDoc) {
        // If branch not found by name, try to find by branchId
        userBranchDoc = await Branch.findOne({ branchId: userBranch });
      }
    } catch (err) {
      console.error('Error finding branch:', err);
      return res.status(500).json({
        success: false,
        message: 'Error finding branch information'
      });
    }

    // Filter by history status
    if (req.query.history === "true") {
      filter.history = true;
    } else {
      filter.history = { $ne: true };
    }

    // Branch filtering logic
    if (!isAdmin) {
      // Non-admin users can only see their branch's data
      if (userBranchDoc && userBranchDoc.branchId !== 'all') {
        filter.branchId = userBranchDoc.branchId;
      }
    } else {
      // Admin users can see all data or filter by branch
      if (req.query.branchId && req.query.branchId !== 'all') {
        try {
          const requestedBranch = await Branch.findOne({ branchId: req.query.branchId });
          if (requestedBranch) {
            filter.branchId = requestedBranch.branchId;
          }
        } catch (err) {
          console.error('Error finding requested branch:', err);
          // Continue without branch filter if branch not found
        }
      }
    }

    // Type filter
    if (req.query.type) {
      filter.type = req.query.type;
    }

    // Date range filter
    if (req.query.startDate && req.query.endDate) {
      filter.dueDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    // Search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { clientName: searchRegex },
        { visaType: searchRegex }
      ];
    }

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

    // Get branch statistics for admin users
    let branchStats = null;
    if (isAdmin) {
      try {
        branchStats = await Deadline.aggregate([
          {
            $group: {
              _id: '$branchId',
              count: { $sum: 1 },
              upcomingDeadlines: {
                $sum: {
                  $cond: [
                    { $gt: ['$dueDate', new Date()] },
                    1,
                    0
                  ]
                }
              }
            }
          },
          {
            $lookup: {
              from: 'branches',
              localField: '_id',
              foreignField: 'branchId',
              as: 'branchDetails'
            }
          },
          {
            $unwind: '$branchDetails'
          },
          {
            $project: {
              branchName: '$branchDetails.branchName',
              totalDeadlines: '$count',
              upcomingDeadlines: '$upcomingDeadlines'
            }
          }
        ]);
      } catch (err) {
        console.error('Error getting branch statistics:', err);
        // Continue without branch statistics if there's an error
      }
    }
    
    res.json({ 
      success: true, 
      data: deadlinesWithBranchDetails,
      branchStats: isAdmin ? branchStats : null
    });
  } catch (error) {
    console.error('Error in getDeadlines:', error);
    console.error('Error in getDeadlines:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Restore a deadline
export const restoreDeadline = async (req, res) => {
  try {
    // Get user's branch
    const userBranch = req.user.branch;
    if (!userBranch) {
      return res.status(400).json({
        success: false,
        message: 'User branch not found in token'
      });
    }

    // Get branch details
    const userBranchDoc = await Branch.findOne({ branchName: userBranch });
    if (!userBranchDoc) {
      return res.status(400).json({
        success: false,
        message: 'Branch not found in database'
      });
    }

    // Find the deadline
    const deadline = await Deadline.findById(req.params.id);
    if (!deadline) {
      return res.status(404).json({
        success: false,
        message: 'Deadline not found'
      });
    }

    // Check if user has access to this deadline
    if (userBranchDoc.branchId !== 'all' && deadline.branchId !== userBranchDoc.branchId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify this deadline'
      });
    }

    // Update the deadline
    const updatedDeadline = await Deadline.findByIdAndUpdate(
      req.params.id,
      { history: false },
      { history: false },
      { new: true }
    );

    // Get branch details for response
    let branchDetails = null;
    if (updatedDeadline.branchId) {
      branchDetails = await Branch.findOne({ branchId: updatedDeadline.branchId });
    }

    const responseData = {
      ...updatedDeadline.toObject(),
      branchId: branchDetails ? {
        branchName: branchDetails.branchName,
        branchLocation: branchDetails.branchLocation,
        branchId: branchDetails.branchId
      } : null
    };
    
    res.json({ success: true, data: responseData });
  } catch (error) {
    console.error('Error in restoreDeadline:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
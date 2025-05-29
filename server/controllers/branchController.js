import Branch from '../models/Branch.js';
import mongoose from 'mongoose';

// Create default branch if none exists
export const createDefaultBranch = async () => {
  try {
    const existingBranch = await Branch.findOne();
    if (!existingBranch) {
      const defaultBranch = new Branch({
        branchName: 'Indore Branch',
        branchLocation: 'Indore, Madhya Pradesh',
        branchId: 'IND001',
        email: 'indore@visa.com',
        contactNo: '+91 1234567890',
        head: {
          name: 'Branch Manager',
          contactNo: '+91 9876543210',
          email: 'manager@visa.com',
          gender: 'Male'
        }
      });
      await defaultBranch.save();
      console.log('Default branch created successfully');
      return defaultBranch;
    }
    return existingBranch;
  } catch (error) {
    console.error('Error creating default branch:', error);
    throw error;
  }
};

// Get all branches
export const getBranches = async (req, res) => {
  try {
    const branches = await Branch.find();
    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get branch by ID
export const getBranch = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }
    res.json(branch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new branch
export const createBranch = async (req, res) => {
  try {
    const branch = new Branch(req.body);
    await branch.save();
    res.status(201).json(branch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update branch
export const updateBranch = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }
    res.json(branch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete branch
export const deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }
    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
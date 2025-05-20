import Branch from '../models/Branch.js';

export const createBranch = async (req, res) => {
  try {
    const {
      branchName,
      branchLocation,
      branchId,
      email,
      contactNo,
      head
    } = req.body;

    const newBranch = new Branch({
      branchName,
      branchLocation,
      branchId,
      email,
      contactNo,
      head,
    });

    await newBranch.save();

    res.status(201).json({ message: 'Branch created successfully', branch: newBranch });
  } catch (err) {
    res.status(500).json({ message: 'Error creating branch', error: err.message });
  }
};

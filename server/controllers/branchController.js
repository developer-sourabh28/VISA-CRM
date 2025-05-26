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

export const getBranches = async (req, res) => {
    try {
        const branches = await Branch.find(); // Fetch all branches
        res.status(200).json({ message: 'Branches fetched successfully', branches });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching branches', error: err.message });
    }
};
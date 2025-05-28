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

export const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Delete request for branch id:", id); // Debug log
    const branch = await Branch.findByIdAndDelete(id);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }
    res.status(200).json({ message: 'Branch deleted successfully', branch });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting branch', error: err.message });
  }
};
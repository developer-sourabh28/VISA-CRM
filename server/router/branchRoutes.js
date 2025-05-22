import express from 'express';
import { createBranch } from '../controllers/branchController.js';

const router = express.Router();

router.post('/', createBranch); // POST /api/branches

export default router;

import express from 'express';
import { createBranch , getBranches} from '../controllers/branchController.js';

const router = express.Router();

router.post('/', createBranch); // POST /api/branches
router.get('/', getBranches);

export default router;


import express from 'express';
import { createBranch , getBranches, deleteBranch} from '../controllers/branchController.js';

const router = express.Router();

router.post('/', createBranch); // POST /api/branches
router.get('/', getBranches);
router.delete('/:id', deleteBranch);

export default router;


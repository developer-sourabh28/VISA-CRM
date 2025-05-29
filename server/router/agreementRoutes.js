// routes/agreementRoutes.js - Updated routes for GridFS
import express from 'express';
import upload from '../middleware/upload.js';
import { 
    createAgreement, 
    getAllAgreements, 
    getAgreementByBranch, 
    deleteAgreement,
    getPDFFile 
} from '../controllers/agreementController.js';

const router = express.Router();

// Create new agreement with PDF upload
router.post('/agreement', upload.single('pdf'), createAgreement);

// Get all agreements
router.get('/', getAllAgreements);

// Get agreement by branch name
router.get('/:branchName', getAgreementByBranch);

// Delete agreement by branch name
router.delete('/:branchName', deleteAgreement);

// Serve PDF file from GridFS
router.get('/file/:filename', getPDFFile);

export default router;
// server/router/agreementRoutes.js
import express from 'express';
import multer from 'multer';
import upload from '../middleware/gridFsStorage.js';
import { getAgreementByBranch, getAllAgreements, updateAgreementPDF, createAgreement } from '../controllers/agreementController.js';

const router = express.Router();


// Routes
router.get('/:branchName', getAgreementByBranch);
router.post('/:branchName', upload.single('pdf'), updateAgreementPDF);
router.get('/',getAllAgreements);
router.post('/agreement', upload.single('pdf'), createAgreement);
export default router;

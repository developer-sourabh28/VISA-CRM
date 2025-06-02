import express from "express";
import { register, login, getProfile, logout, createConsultant } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticateToken, getProfile);
router.get('/logout', logout);
router.post('/create-consultant', authenticateToken, createConsultant);

export default router; 
import express from "express";
import { register, login, getProfile, logout, createConsultant } from '../controllers/authController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', isAuthenticated, getProfile);
router.get('/logout', logout);
router.post('/create-consultant', isAuthenticated, createConsultant);

export default router; 
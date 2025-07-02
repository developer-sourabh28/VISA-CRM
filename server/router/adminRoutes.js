import express from 'express';
import * as adminController from '../controllers/adminController.js';

console.log('Admin routes being loaded...');

const router = express.Router();

// Public routes (no authentication required)
router.get('/test', adminController.testEndpoint);
router.post('/init', adminController.initAdmin);

console.log('Admin routes registered: GET /test, POST /init');

export default router; 
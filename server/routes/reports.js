import express from 'express';
import {
  getRevenueData,
  getRevenueChartData,
  getExpensesData,
  getExpenseChartData,
  getPnlData,
  updatePaymentAmount
} from '../controllers/reportsController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// Revenue Reports
router.get('/revenue', getRevenueData);
router.get('/revenue/chart', getRevenueChartData);

// Expenses Reports
router.get('/expenses', getExpensesData);
router.get('/expenses/chart', getExpenseChartData);

// Profit & Loss Reports
router.get('/pnl', getPnlData);

// Payment Updates
router.patch('/payments/:id', updatePaymentAmount);

export default router; 
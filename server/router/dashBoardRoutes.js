import express from "express";
const router = express.Router();
import { getDashboardStats } from '../controllers/dashboardController.js';


router.get("/charts/application-status", (req, res) => {
  res.json({ data: [] }); 
});

router.get("/charts/monthly-applications", (req, res) => {
  res.json({ data: [] }); 
});

router.get("/recent-applications", (req, res) => {
  res.json({ data: [] }); 
});

router.get("/upcoming-deadlines", (req, res) => {
  res.json({ data: [] }); 
});

router.get('/stats', (req, res, next) => {
  // console.log("GET /api/dashboard/stats called");
  next();
}, getDashboardStats);

export default router;
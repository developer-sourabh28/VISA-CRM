// dashboardRoutes.js
import express from "express";
const router = express.Router();
import Client from '../models/Client.js';
// import Application from '../models/Application.js';
import Appointment from '../models/Appointment.js';

import {
  getDashboardStats,
  getApplicationStatusChart,
  getMonthlyApplicationsChart,
  getRecentApplications,
  getUpcomingDeadlines,
  getRecentActivities
} from '../controllers/dashboardController.js';

router.get("/charts/application-status", getApplicationStatusChart);
router.get("/charts/monthly-applications", getMonthlyApplicationsChart);
router.get("/recent-applications", getRecentApplications);
router.get("/upcoming-deadlines", getUpcomingDeadlines);
router.get("/stats", getDashboardStats);
router.get("/recent-activities", getRecentActivities); // Good to track new activity

// routes/dashboard.js
router.get('/recent-clients', async (req, res) => {
  const since = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const clients = await Client.find({
    createdAt: { $gte: since },
    status: "converted", // if you track status like "enquiry", "converted", etc.
  }).sort({ createdAt: -1 });
  res.json({ data: clients });
});

// router.get('/status-updates', async (req, res) => {
//   const since = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
//   const applications = await Application.find({
//     updatedAt: { $gte: since },
//   }).sort({ updatedAt: -1 });
//   res.json({ data: applications });
// });

router.get('/recent-appointments', async (req, res) => {
  const since = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const appointments = await Appointment.find({
    scheduledAt: { $gte: since },
  }).sort({ scheduledAt: -1 });
  res.json({ data: appointments });
});


export default router;

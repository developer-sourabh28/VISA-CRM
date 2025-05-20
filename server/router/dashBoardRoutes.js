import express from "express";
const router = express.Router();

router.get("/charts/application-status", (req, res) => {
  res.json({ data: [] }); // Replace with real logic
});

router.get("/charts/monthly-applications", (req, res) => {
  res.json({ data: [] }); // Replace with real logic
});

router.get("/recent-applications", (req, res) => {
  res.json({ data: [] }); // Replace with real logic
});

router.get("/upcoming-deadlines", (req, res) => {
  res.json({ data: [] }); // Replace with real logic
});

router.get("/stats", (req, res) => {
  res.json({ data: {} }); // Replace with real logic
});

export default router;
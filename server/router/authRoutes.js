import express from "express";
const router = express.Router();

router.get("/profile", (req, res) => {
  res.json({ user: null }); // Replace with real logic
});

export default router;
import express from "express";
import { createDeadline, getDeadlines, updateDeadline, deleteDeadline, restoreDeadline } from "../controllers/deadlineController.js";
import Deadline from "../models/Deadline.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect all routes
router.use(protect);

router.post("/", createDeadline);
router.get("/", getDeadlines);
router.put("/:id", updateDeadline);
router.delete("/:id", deleteDeadline);

// Mark as done (move to history)
router.patch("/:id/mark-done", async (req, res) => {
  try {
    const deadline = await Deadline.findByIdAndUpdate(
      req.params.id,
      { history: true },
      { new: true }
    );
    if (!deadline) {
      return res.status(404).json({ success: false, message: "Deadline not found" });
    }
    res.json({ success: true, data: deadline });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Restore from history
router.patch("/:id/restore", restoreDeadline);

export default router;
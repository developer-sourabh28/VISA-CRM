import express from "express";
import {
  getEnquiries,
  getEnquiry,
  createEnquiry,
  updateEnquiry,
  deleteEnquiry,
} from "../controllers/enquiriesController.js";

const router = express.Router();

// GET /api/enquiries - Get all enquiries
router.get("/", getEnquiries);

// GET /api/enquiries/:id - Get single enquiry
router.get("/:id", getEnquiry);

// POST /api/enquiries - Create new enquiry
router.post("/", createEnquiry);

// PUT /api/enquiries/:id - Update enquiry
router.put("/:id", updateEnquiry);

// DELETE /api/enquiries/:id - Delete enquiry
router.delete("/:id", deleteEnquiry);

export default router;
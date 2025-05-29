import express from "express";
import { createOrUpdateAgreement, getAgreement } from "../../controllers/visaTracker/visaAgreementController.js";

const router = express.Router();

// Note: These routes will be mounted under /api/visa-tracker
router.post("/agreement/:clientId", createOrUpdateAgreement);
router.get("/agreement/:clientId", getAgreement);

export default router;
import express from "express";
import Client from '../models/Client.js';
import VisaTracker from '../models/VisaTracker.js';

const router = express.Router();
// Get client by ID
router.get('/client/:id', async (req, res) => {
  const client = await Client.findById(req.params.id);
  res.json(client);
});

// Get tracker by clientId
router.get('/visa-tracker/:clientId', async (req, res) => {
  const tracker = await VisaTracker.findOne({ clientId: req.params.clientId });
  res.json(tracker);
});

// Create tracker for a client
router.post('/visa-tracker', async (req, res) => {
  const newTracker = new VisaTracker({
    clientId: req.body.clientId,
    steps: [
      { step_title: "Send Agreement", status: "NOT STARTED" },
      { step_title: "Schedule Meeting", status: "NOT STARTED" },
      { step_title: "Upload Documents", status: "NOT STARTED" },
      { step_title: "Payment Collection", status: "NOT STARTED" },
      { step_title: "Appointment Booking", status: "NOT STARTED" },
      { step_title: "Final Submission", status: "NOT STARTED" },
    ]
  });
  await newTracker.save();
  res.json(newTracker);
});


export default router;

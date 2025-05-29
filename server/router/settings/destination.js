import express from "express";
import Destination from "../../models/settings/Destination.js";

const router = express.Router();

// Get all destinations
router.get("/", async (req, res) => {
  try {
    const destinations = await Destination.find();
    res.json(destinations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new destination
router.post("/", async (req, res) => {
  try {
    const destination = new Destination(req.body);
    await destination.save();
    res.status(201).json(destination);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a destination by ID
router.delete("/:id", async (req, res) => {
  try {
    const destination = await Destination.findByIdAndDelete(req.params.id);
    if (!destination) {
      return res.status(404).json({ error: "Destination not found" });
    }
    res.json({ message: "Destination deleted successfully", destination });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updatedDestination = await Destination.findByIdAndUpdate(
      req.params.id,  
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedDestination) {
      return res.status(404).json({ error: "Destination not found" });
    }
    res.json(updatedDestination);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
);

export default router;

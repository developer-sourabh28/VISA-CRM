import express from "express";
import Currency from "../../models/settings/currency.js";

const router = express.Router();

// Save a pinned currency
router.post("/", async (req, res) => {
  try {
    const currency = new Currency(req.body);
    await currency.save();
    res.status(201).json(currency);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all pinned currencies
router.get("/", async (req, res) => {
  try {
    const currencies = await Currency.find();
    res.status(200).json(currencies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const currency = await Currency.findByIdAndDelete(req.params.id);
    if (!currency) {
      return res.status(404).json({ error: "Currency not found" });
    }
    res.json({ message: "Currency deleted successfully", currency });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
export default router;

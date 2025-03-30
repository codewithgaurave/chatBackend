// routes/calls.js
const express = require("express");
const Call = require("../models/Call");
const User = require("../models/User");
const router = express.Router();

// Get call history for a user
router.get("/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const calls = await Call.find({
      $or: [{ caller: userId }, { receiver: userId }]
    })
      .sort({ createdAt: -1 })
      .populate("caller receiver", "name email");

    res.json(calls);
  } catch (error) {
    console.error("Error fetching call history:", error);
    res.status(500).json({ error: "Failed to fetch call history" });
  }
});

// Get call details
router.get("/:callId", async (req, res) => {
  try {
    const { callId } = req.params;
    const call = await Call.findById(callId)
      .populate("caller receiver", "name email");

    if (!call) {
      return res.status(404).json({ error: "Call not found" });
    }

    res.json(call);
  } catch (error) {
    console.error("Error fetching call details:", error);
    res.status(500).json({ error: "Failed to fetch call details" });
  }
});

module.exports = router;
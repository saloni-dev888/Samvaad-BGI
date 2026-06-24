const express = require("express");
const router = express.Router();
const Concern = require("../models/Concern");
const { authMiddleware } = require("../utils/authMiddleware"); // optional, if only logged-in users allowed to submit

// GET all concerns (for admin dashboard)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const concerns = await Concern.find().sort({ createdAt: -1 });
    res.json({ success: true, data: concerns });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST a new concern
router.post("/", async (req, res) => {
  try {
    const { subject, description, anonymous } = req.body;
    if (!subject || !description) return res.status(400).json({ success: false, message: "Subject and description required" });

    const concern = new Concern({
      subject,
      description,
      anonymous: anonymous === true
    });

    await concern.save();

    // Emit via Socket.io for live updates on admin dashboard
    req.app.get("io").emit("newConcern", concern);

    res.json({ success: true, message: "Concern submitted successfully", data: concern });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// POST /api/wec/vote/:id
router.post("/vote/:id", authMiddleware, async (req, res) => {
  try {
    const concern = await Concern.findById(req.params.id);
    if (!concern) return res.status(404).json({ success: false, message: "Concern not found" });

    // Check if user already voted
    if (concern.voters.includes(req.user.email)) {
      return res.status(400).json({ success: false, message: "You already voted for this concern" });
    }

    concern.votes += 1;
    concern.voters.push(req.user.email);
    await concern.save();

    req.app.get("io").emit("concernUpdated", concern); // live update
    res.json({ success: true, data: concern });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


module.exports = router;

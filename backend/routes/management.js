// backend/routes/management.js
const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const Feedback = require("../models/Feedback");
const Concern = require("../models/Concern");
const Event = require("../models/Event");
const User = require("../models/user");

// ✅ Import role middleware
const { authMiddleware, authorizeRoles } = require("../utils/authMiddleware");

// ✅ Define admin-only shortcut ONCE here
const adminOnly = authorizeRoles("admin");


// 🧠 Get overview statistics for the Management Dashboard
router.get("/stats", authMiddleware, authorizeRoles("admin"), async (req, res) => {

  try {
    const totalUsers = await User.countDocuments();
    const totalFeedback = await Feedback.countDocuments();
    const totalSuggestions = await Feedback.countDocuments({ type: "Suggestion" });
    const totalMessages = await Message.countDocuments({ isAnonymous: true });
    const totalConcerns = await Concern.countDocuments();
    const totalEvents = await Event.countDocuments();

    res.json({
      success: true,
      data: {
        users: totalUsers,
        feedback: totalFeedback,
        suggestions: totalSuggestions,
        anonymousMessages: totalMessages,
        concerns: totalConcerns,
        events: totalEvents,
      },
    });
  } catch (error) {
    console.error("Error fetching management stats:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// 🧾 Fetch latest feedback and suggestions
router.get("/feedback", authMiddleware, adminOnly, async (req, res) => {
  try {
    const latestFeedback = await Feedback.find().sort({ createdAt: -1 }).limit(10);
    res.json({ success: true, data: latestFeedback });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({ success: false, message: "Failed to fetch feedback." });
  }
});


// 📨 Fetch anonymous messages
router.get("/anonymous", authMiddleware, adminOnly, async (req, res) => {
  try {
    const messages = await Message.find({ anonymous: true })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, data: messages });
  } catch (error) {
    console.error("Error fetching anonymous messages:", error);
    res.status(500).json({ success: false, message: "Failed to fetch messages." });
  }
});

// 📨 Fetch all messages (anonymous + normal)
router.get("/messages", authMiddleware, adminOnly, async (req, res) => {
  try {
    const messages = await Message.find()
      .sort({ createdAt: -1 })
      .limit(50); // optional limit
    res.json({ success: true, data: messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ success: false, message: "Failed to fetch messages." });
  }
});


// 🧍‍♀️ Fetch WEC Concerns
router.get("/concerns", authMiddleware, adminOnly, async (req, res) => {
  try {
    const concerns = await Concern.find().sort({ createdAt: -1 }).limit(15);
    res.json({ success: true, data: concerns });
  } catch (error) {
    console.error("Error fetching WEC concerns:", error);
    res.status(500).json({ success: false, message: "Failed to fetch concerns." });
  }
});

// 🎉 Fetch event list
router.get("/events", authMiddleware, adminOnly, async (req, res) => {
  try {
    const events = await Event.find().sort({ date: -1 }).limit(10);
    res.json({ success: true, data: events });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ success: false, message: "Failed to fetch events." });
  }
});


module.exports = router;
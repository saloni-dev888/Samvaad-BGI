const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../utils/authMiddleware");
const Feedback = require("../models/Feedback");
const Suggestion = require("../models/Suggestion");

// ✅ Submit feedback
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, text, category } = req.body;
    if (!text || !category) return res.status(400).json({ success: false, message: "Invalid data" });

    const feedback = await Feedback.create({
      name,
      content: text,
      category,
      type: "Feedback",
    });

    res.json({ success: true, data: feedback });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Submit suggestion
router.post("/suggestions", authMiddleware, async (req, res) => {
  try {
    const { text, tags } = req.body;
    if (!text) return res.status(400).json({ success: false, message: "Suggestion text required" });

    const suggestion = await Suggestion.create({
      content: text,
      tags: tags ? tags.split(",").map(t => t.trim()) : [],
      type: "Suggestion",
    });

    res.json({ success: true, data: suggestion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Get all feedback + suggestions
router.get("/", authMiddleware, async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    const suggestions = await Suggestion.find().sort({ createdAt: -1 });

    // Merge and sort by date
    const all = [...feedbacks, ...suggestions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, data: all });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;



const express = require("express");
const jwt = require("jsonwebtoken");
const Idea = require("../models/Idea");
const User = require("../models/user");
const { clean } = require("../utils/contentFilter.cjs");

const router = express.Router();

// Middleware: authenticate via JWT
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // contains {id, role, department}
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// POST /api/ideas -> submit new idea
router.post("/", authMiddleware, async (req, res) => {
  try {
    const idea = new Idea({
      text: req.body.text,
      category: req.body.category,
      time: req.body.time,
      user: req.user.id   // 👈 store logged-in user ID
    });

    await idea.save();
    res.status(201).json(idea);
  } catch (err) {
    res.status(500).json({ message: "Error submitting idea" });
  }
});

// Get all ideas (sorted, with submitter info)
router.get("/", async (req, res) => {
  try {
    const ideas = await Idea.find()
      .populate("user", "username email")  // fetch username + email
      .sort({ createdAt: -1 });

    res.json(ideas);
  } catch (err) {
    console.error("Error fetching ideas:", err);
    res.status(500).json({ message: "Server error while fetching ideas" });
  }
});



// PATCH /api/ideas/:id/like -> increment likes
router.patch("/:id/like", async (req, res) => {
  try {
    const idea = await Idea.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );
    res.json(idea);
  } catch (err) {
    console.error("Like error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

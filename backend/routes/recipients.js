// backend/routes/recipients.js
const express = require("express");
const router = express.Router();
const User = require("../models/user"); // We can reuse the User model

// GET /api/recipients -> Get all potential recipients
router.get("/", async (req, res) => {
  try {
    // Find all users and select only their email and username for the list
    const recipients = await User.find({}, 'email username department').sort({ username: 1 });

    res.json(recipients);
  } catch (err) {
    console.error("Error fetching recipients:", err);
    res.status(500).json({ message: "Failed to fetch recipients due to a server error." });
  }
});

module.exports = router;
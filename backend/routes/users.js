// backend/routes/users.js
const express = require("express");
const router = express.Router();
const User = require("../models/user"); // make sure this model exists

// ✅ Block user (triggered by n8n moderation)
router.post("/block", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Missing email" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.blocked = true;
    await user.save();

    console.log(`🚫 User ${email} has been blocked by moderation.`);
    res.json({ success: true, message: `User ${email} blocked.` });
  } catch (err) {
    console.error("Block user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

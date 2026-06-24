// backend/models/user.js
const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const User = require("../models/user");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },            // display name
  email: { type: String, required: true, unique: true }, // college ID / email
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "faculty", "wec", "admin"], required: true },
  department: { type: String, required: true },

  // verification + moderation
  isVerified: { type: Boolean, default: false }, // email OTP verified
  otpCode: { type: String, default: null },
  otpExpiry: { type: Date, default: null },

  // moderation status
  blocked: { type: Boolean, default: false },
  blockReason: { type: String, default: null },

  createdAt: { type: Date, default: Date.now },
});

// ✅ Block user (triggered by n8n)
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
module.exports = mongoose.models.User || mongoose.model("User", userSchema);

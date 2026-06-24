const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../models/user");
const axios = require("axios");

// ✅ Use n8n webhook details from environment variables
const N8N_BASE_URL = process.env.N8N_BASE_URL;
const N8N_API_KEY = process.env.N8N_API_KEY || "";

/* ----------------------------------------------------
 *  REGISTER (Step 1: Send OTP)
 * ---------------------------------------------------- */
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, role, department } = req.body;

    if (!username || !email || !password || !role || !department) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ✅ Restrict registration to @bit.ac.in only
    if (!email.endsWith("@bit.ac.in")) {
      return res.status(400).json({ message: "Only @bit.ac.in emails are allowed to register." });
    }

    const existingUser = await User.findOne({ email });

    // 🧠 Case 1: Already verified
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: "User already exists." });
    }

    // 🧠 Case 2: Unverified user → Resend OTP
    if (existingUser && !existingUser.isVerified) {
      const otp = generateOTP();
      existingUser.otpCode = otp;
      existingUser.otpExpiry = Date.now() + 15 * 60 * 1000;
      await existingUser.save();

      await sendOTPThroughN8N(email, username, otp);
      return res.status(200).json({
        message: "OTP resent to your email. Please verify your account.",
      });
    }

    // 🧂 Hash password for new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();

    // Create new user (unverified)
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role,
      department,
      isVerified: false,
      otpCode: otp,
      otpExpiry: Date.now() + 15 * 60 * 1000,
    });

    await newUser.save();
    await sendOTPThroughN8N(email, username, otp);

    res.status(201).json({
      message: "OTP sent to your email. Please verify to complete registration.",
    });
  } catch (err) {
    console.error("❌ Register error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* ----------------------------------------------------
 *  VERIFY OTP (Step 2)
 * ---------------------------------------------------- */
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (user.isVerified)
      return res.status(400).json({ message: "User already verified" });

    if (!user.otpCode || user.otpCode !== otp || Date.now() > user.otpExpiry) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otpCode = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ message: "✅ Email verified successfully. You can now log in." });
  } catch (err) {
    console.error("❌ Verify OTP error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* ----------------------------------------------------
 *  LOGIN
 * ---------------------------------------------------- */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    // ✅ Restrict login to @bit.ac.in only
    if (!email.endsWith("@bit.ac.in")) {
      return res.status(400).json({ message: "Only @bit.ac.in accounts can log in." });
    }

    const foundUser = await User.findOne({ email });
    if (!foundUser) return res.status(400).json({ message: "User not found" });

    if (foundUser.blocked)
      return res.status(403).json({ message: "Your account has been blocked." });

    if (!foundUser.isVerified)
      return res.status(403).json({ message: "Please verify your email first (OTP)." });

    const match = await bcrypt.compare(password, foundUser.password);
    if (!match)
      return res.status(400).json({ message: "Incorrect password" });

    const token = jwt.sign(
      {
        id: foundUser._id,
        role: foundUser.role,
        department: foundUser.department,
        email: foundUser.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      id: foundUser._id,
      username: foundUser.username,
      email: foundUser.email,
      role: foundUser.role,
      department: foundUser.department,
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* ----------------------------------------------------
 *  Helper: Send OTP via n8n Webhook
 * ---------------------------------------------------- */
async function sendOTPThroughN8N(email, username, otp) {
  try {
    if (!N8N_BASE_URL) throw new Error("N8N_BASE_URL not set in .env");
    const webhookUrl = `${N8N_BASE_URL}/webhook/send-otp`;
    console.log(`📨 Sending OTP to ${email} via n8n webhook...`);
    await axios.post(webhookUrl, { email, otp, username }, {
      headers: { "x-api-key": N8N_API_KEY }
    });
  } catch (err) {
    console.error("❌ Failed to send OTP via n8n:", err.message);
    throw new Error("Failed to send OTP email.");
  }
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = router;

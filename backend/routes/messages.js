const express = require("express");
const router = express.Router();
const axios = require("axios");
const { authMiddleware } = require("../utils/authMiddleware");
const Message = require("../models/Message");
const User = require("../models/user");

/* =====================================================
 *  📩 SEND MESSAGE (Moderated by n8n)
 * ===================================================== */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { recipientEmail, content, anonymous, senderDetails } = req.body;

    if (!recipientEmail || !content) {
      return res.status(400).json({ message: "Recipient and content are required." });
    }

    // ✅ Restrict communication to @bit.ac.in emails
    if (
      !recipientEmail.endsWith("@bit.ac.in") ||
      !req.user.email.endsWith("@bit.ac.in")
    ) {
      return res
        .status(403)
        .json({ message: "Only @bit.ac.in users can communicate." });
    }

    // 🔹 Step 1: Create message first (status pending)
    const msg = new Message({
      senderEmail: req.user.email,
      recipientEmail,
      content,
      anonymous: !!anonymous,
      senderDetails: anonymous ? senderDetails || "Anonymous" : req.user.email,
      status: "pending",
    });
    await msg.save();

    // Step 2: Send to n8n for moderation
const N8N_BASE_URL = process.env.N8N_BASE_URL || "http://localhost:5678";
console.log("🛰️ Sending to n8n moderation:", {
  messageId: msg._id,
  senderEmail: msg.senderEmail,
  content: msg.content
});

const response = await axios.post(
  `${N8N_BASE_URL}/webhook/message-filter`,
  {
    messageId: msg._id.toString(),
    senderEmail: msg.senderEmail,
    recipientEmail: msg.recipientEmail,
    content: msg.content,
  },
  { timeout: 20000 }
);

console.log("✅ Received moderation response:", response.data);


// Step 3: Update message status based on moderation
const moderationResult = response.data||{};

msg.status = moderationResult.flagged===true? "rejected" : "approved";
msg.abuseReason = moderationResult.abuseReason || null;
await msg.save();

console.log("Moderation response:", response.data);

    // 🔹 Step 4: Emit socket events
    const io = req.app.get("io");
    if (io) {
      if (msg.status === "approved") {
        io.to(recipientEmail).emit("newMessage", msg);
        io.to(req.user.email).emit("messageSent", msg);
      } else {
        io.to(req.user.email).emit("messageRejected", msg);
      }
    }

    // 🔹 Step 5: Send final response
    res.status(201).json({
      message:
        msg.status === "approved"
          ? `✅ Message sent to ${recipientEmail}`
          : `🚫 Message rejected by moderation`,
      msg,
    });
  } catch (err) {
    console.error("Message send error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================
 *  💾 SAVE DRAFT
 * ===================================================== */
router.post("/draft", authMiddleware, async (req, res) => {
  try {
    const { recipientEmail, content } = req.body;
    if (!content)
      return res.status(400).json({ message: "Message content is required." });

    const draft = new Message({
      senderEmail: req.user.email,
      recipientEmail,
      content,
      status: "draft",
    });

    await draft.save();
    res.status(201).json({ message: "Draft saved.", draft });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

/* =====================================================
 *  📥 INBOX
 * ===================================================== */
router.get("/inbox", authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({
      recipientEmail: req.user.email,
      status: "approved",
    }).sort({ createdAt: -1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

/* =====================================================
 *  📤 SENT
 * ===================================================== */
router.get("/sent", authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({
      senderEmail: req.user.email,
      status: { $in: ["approved", "rejected", "pending"] },
    }).sort({ createdAt: -1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

/* =====================================================
 *  📝 DRAFTS
 * ===================================================== */
router.get("/drafts", authMiddleware, async (req, res) => {
  try {
    const drafts = await Message.find({
      senderEmail: req.user.email,
      status: "draft",
    }).sort({ createdAt: -1 });

    res.json(drafts);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

/* =====================================================
 *  🔄 MODERATION CALLBACK (Called by n8n)
 * ===================================================== */
router.post("/moderation-callback", async (req, res) => {
  try {
    const { messageId, flagged, abuseReason } = req.body;
    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ message: "Message not found" });

    msg.status = flagged ? "rejected" : "approved";
    msg.abuseReason = abuseReason || null;
    await msg.save();

    const io = req.app.get("io");
    if (io) {
      if (msg.status === "approved") {
        io.to(msg.recipientEmail).emit("newMessage", msg);
      } else {
        io.to(msg.senderEmail).emit("messageRejected", msg);
      }
    }

    res.json({ success: true, msg });
  } catch (err) {
    console.error("Moderation callback error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================
 *  🚫 VIOLATION TRACKING (Called by n8n on flagged messages)
 * ===================================================== */
router.post("/violation", async (req, res) => {
  try {
    const { senderEmail } = req.body;
    if (!senderEmail)
      return res.status(400).json({ message: "Sender email required" });

    const user = await User.findOne({ email: senderEmail });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.offenseCount = (user.offenseCount || 0) + 1;
    if (user.offenseCount >= 5) {
      user.blocked = true;
      await user.save();
      return res.json({
        message: `${senderEmail} has been blocked after 5 offenses.`,
        blocked: true,
      });
    }

    await user.save();
    res.json({ message: `Offense recorded. (${user.offenseCount}/5)` });
  } catch (err) {
    console.error("Violation tracking error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

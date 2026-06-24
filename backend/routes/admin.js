const express = require("express");
const router = express.Router();
const Message = require("../models/Message");

// ✅ Approve message
router.post("/approve/:id", async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: "Message not found" });

    msg.status = "approved";
    await msg.save();

    // 🔔 Emit event to notify recipient
    const io = req.app.get("io");
    if (io) {
      io.emit("messageApproved", msg);
    }

    res.json({ message: "Message approved", msg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Reject message
router.post("/reject/:id", async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: "Message not found" });

    msg.status = "rejected";
    msg.reason = req.body.reason || "Not specified";
    await msg.save();

    // 🔔 Emit event to notify sender
    const io = req.app.get("io");
    if (io) {
      io.emit("messageRejected", msg);
    }

    res.json({ message: "Message rejected", msg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get all pending messages for moderation
router.get("/pending", async (req, res) => {
  try {
    const messages = await Message.find({ status: "pending" }).sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

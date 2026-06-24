// backend/models/Message.js
const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  recipientEmail: { type: String, required: true, trim: true, index: true },
  senderEmail: { type: String, required: true, trim: true, index: true },
  senderDetails: { type: String, default: null },
  content: { type: String, required: true, trim: true },
  anonymous: { type: Boolean, default: false },
  status: { type: String, enum: ["draft","pending","approved","rejected"], default: "approved", index: true },
  flagged: { type: Boolean, default: false },
  abuseReason: { type: String, default: null },
  isRead: { type: Boolean, default: false },
  traceId: { type: String, index: true },
}, { timestamps: true });

module.exports = mongoose.model("Message", MessageSchema);

// backend/models/Event.js
const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  date: { type: Date, required: true }, // ✅ now a Date, not string
  title: { type: String, required: true, trim: true },
  category: { type: String, enum: ["Tech", "Fun", "Workshop", "Other"], default: "Other" },
  createdBy: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    username: String,
    role: String
  }
}, { timestamps: true });

// ✅ index for faster queries
EventSchema.index({ date: 1 });

module.exports = mongoose.models.Event || mongoose.model("Event", EventSchema);

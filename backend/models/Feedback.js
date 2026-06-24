// backend/models/Feedback.js
const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema({
  name: { type: String, default: null },
  content: { type: String, required: true },
  category: { type: String, required: true },
  type: { type: String, default: "Feedback" },
}, { timestamps: true });

module.exports = mongoose.model("Feedback", FeedbackSchema);

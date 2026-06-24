// backend/models/Suggestion.js
const mongoose = require("mongoose");

const SuggestionSchema = new mongoose.Schema({
  content: { type: String, required: true },
  tags: { type: [String], default: [] },
  type: { type: String, default: "Suggestion" },
}, { timestamps: true });

module.exports = mongoose.model("Suggestion", SuggestionSchema);

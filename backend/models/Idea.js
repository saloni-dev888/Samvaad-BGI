const mongoose = require("mongoose");

const IdeaSchema = new mongoose.Schema({
  text: { type: String, required: true },
  category: { type: String, enum: ["Tech", "Fun", "Workshop"], required: true },
  time: { type: String },
  likes: { type: Number, default: 0 },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" } // 👈 must be ref: "User"
}, { timestamps: true });

module.exports = mongoose.models.Idea ||mongoose.model("Idea", IdeaSchema);

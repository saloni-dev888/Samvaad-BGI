const mongoose = require("mongoose");

const ConcernSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  description: { type: String, required: true },
  anonymous: { type: Boolean, default: true },
  submittedBy: { type: String, default: null },
  votes: { type: Number, default: 0 },
  voters: [{ type: String }] // store user IDs/emails who voted
}, { timestamps: true });

module.exports = mongoose.model("Concern", ConcernSchema);

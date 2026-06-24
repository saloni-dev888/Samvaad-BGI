const mongoose = require("mongoose");

const loginHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  role: { type: String },
  ip: { type: String },
  loginTime: { type: Date, default: Date.now }
});

module.exports = mongoose.models.LoginHistory || mongoose.model("LoginHistory", loginHistorySchema);

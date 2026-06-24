// backend/routes/calendar.js
const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const { authMiddleware } = require("../utils/authMiddleware");
const { clean } = require("../utils/contentFilter.cjs");

// ================== UPLOAD (Admin Only) ==================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "..", "uploads");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, "calendar.pdf"); // Always overwrite with the new one
  }
});

const upload = multer({ storage });

// Admin uploads new PDF
router.post("/upload-pdf", authMiddleware, upload.single("calendar"), (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admin can upload calendar PDF" });
  }
  res.json({ message: "Calendar PDF updated successfully!" });
});

// Anyone can download PDF
router.get("/download-pdf", (req, res) => {
  const filePath = path.join(__dirname, "..", "uploads", "calendar.pdf");
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "No calendar uploaded yet" });
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline; filename=Academic_Calendar.pdf");
  res.sendFile(filePath);
});



module.exports = router;

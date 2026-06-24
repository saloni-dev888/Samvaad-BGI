// backend/utils/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ message: "Unauthorized: No token provided" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized: Invalid token format" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "Unauthorized: User not found" });

    if (user.banned) return res.status(403).json({ message: "Your account has been banned." });

    // Attach email + safe info
    req.user = {
      id: user._id,
      email: user.email,    // <-- important
      role: user.role,
      department: user.department,
    };

    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ message: "Forbidden: insufficient role" });
    next();
  };
};

module.exports = { authMiddleware, authorizeRoles };

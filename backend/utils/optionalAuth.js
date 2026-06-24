// backend/utils/optionalAuth.js
const jwt = require("jsonwebtoken");
const User = require("../models/user");

/**
 * optionalAuth(req, res, next)
 * 
 * - If request has "Authorization: Bearer <token>", it tries to verify the token.
 * - If valid → attaches req.user = { id, role, department }.
 * - If no token or invalid token → does not block, continues as anonymous.
 * - Useful for routes where login is optional (e.g., anonymous messages).
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    if (authHeader) {
      const token = authHeader.split(" ")[1];
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);
        if (user && !user.banned) {
          req.user = {
            id: user._id,
            role: user.role,
            department: user.department,
          };
        }
      }
    }

    // Continue request whether user is set or not
    next();
  } catch (err) {
    console.warn("Optional auth failed:", err.message);
    // Don’t block the request, just skip attaching req.user
    next();
  }
};

module.exports = optionalAuth;

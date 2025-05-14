const jwt = require("jsonwebtoken");

// ✅ Basic authentication (for both employee & admin)
exports.authenticate = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ message: "Access Denied: No Token Provided" });
  }

  try {
    const verified = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
    req.user = verified; // Attach decoded user (with role) to request
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid Token" });
  }
};

// ✅ Additional admin-only middleware
exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Access Denied: Admins Only" });
  }
  next();
};

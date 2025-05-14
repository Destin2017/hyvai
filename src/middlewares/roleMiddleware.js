module.exports = (requiredRole) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized: No user data found" });
      }
  
      if (req.user.role !== requiredRole) {
        return res.status(403).json({ message: `Forbidden: ${requiredRole} role required` });
      }
  
      next(); // User has the correct role, proceed
    };
  };
  
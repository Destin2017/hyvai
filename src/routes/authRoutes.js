const express = require("express");
const {
  register,
  login,
  logout,
  getCompanies,
  getMe,
} = require("../controllers/authController");

const { authenticate } = require("../middlewares/authMiddleware"); // ✅ Authentication middleware
const checkRole = require("../middlewares/roleMiddleware"); // ✅ Role-Based Access Control (RBAC)

const router = express.Router();

// ✅ User Registration & Login
router.post("/register", register);
router.post("/login", login);
router.post("/logout", authenticate, logout); // ✅ Ensure logout requires authentication

// ✅ Fetch available companies for registration
router.get("/companies", getCompanies);

// ✅ Get Current Authenticated User (Fix for blank dashboard issue)
router.get("/me", authenticate, getMe);

// ✅ Protected Profile Route (All authenticated users can access)
router.get("/profile", authenticate, (req, res) => {
  res.json({ message: "Welcome to your profile!", user: req.user });
});

// ✅ Admin Dashboard Route (Accessible only by Admins)
router.get("/admin/users", authenticate, checkRole("admin"), async (req, res) => {
  try {
    const connection = await db.getConnection();
    const [users] = await connection.execute("SELECT id, name, email, role FROM users");
    connection.release();
    res.json(users);
  } catch (error) {
    console.error("❌ Error fetching admin users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Employee Dashboard Route (Accessible only by Employees)
router.get("/employee/dashboard", authenticate, checkRole("employee"), (req, res) => {
  res.json({ message: "Welcome Employee!", user: req.user });
});

// ✅ Catch-all route for unknown API requests
router.use((req, res) => {
  res.status(404).json({ message: "API route not found" });
});

module.exports = router;

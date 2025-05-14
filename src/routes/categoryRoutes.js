const express = require("express");
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const { authenticate } = require("../middlewares/authMiddleware"); // Ensure only authenticated users manage categories
const checkRole = require("../middlewares/roleMiddleware"); // Only admin can modify categories

const router = express.Router();

// 📌 Get All Categories
router.get("/", getCategories);

// 📌 Create New Category (Admin Only)
router.post("/", authenticate, checkRole("admin"), createCategory);

// 📌 Update Category (Admin Only)
router.put("/:id", authenticate, checkRole("admin"), updateCategory);

// 📌 Delete Category (Admin Only)
router.delete("/:id", authenticate, checkRole("admin"), deleteCategory);

module.exports = router;

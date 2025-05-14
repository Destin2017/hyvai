const express = require("express");
const multer = require("multer");
const path = require("path");

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const { authenticate } = require("../middlewares/authMiddleware");
const checkRole = require("../middlewares/roleMiddleware");

const router = express.Router();

// 📌 Configure Multer Storage for Multiple Images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Ensure `uploads/` exists in your project root
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName); 
  },
});

// 📌 File Upload Middleware (Supports Multiple Images)
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit size to 5MB per file
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const mimeType = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimeType && extname) {
      return cb(null, true);
    }
    cb(new Error("Only images (jpeg, jpg, png, gif) are allowed"));
  },
});

// 📌 Get All Products (Supports Category Filtering)
router.get("/", async (req, res) => {
  try {
    await getProducts(req, res);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products", error: error.message });
  }
});

// 📌 Get Product by ID
router.get("/:id", async (req, res) => {
  try {
    await getProductById(req, res);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch product details", error: error.message });
  }
});

// 📌 Create New Product (Admin Only + Multiple Image Upload)
router.post("/", authenticate, checkRole("admin"), upload.array("images", 9), async (req, res) => {
  try {
    req.body.images = req.files.map(file => file.filename);
    await createProduct(req, res);
  } catch (error) {
    res.status(500).json({ message: "Failed to create product", error: error.message });
  }
});

// 📌 Update Product (Admin Only + Multiple Image Upload)
router.put("/:id", authenticate, checkRole("admin"), upload.array("images", 9), async (req, res) => {
  try {
    req.body.images = req.files.map(file => file.filename);
    await updateProduct(req, res);
  } catch (error) {
    res.status(500).json({ message: "Failed to update product", error: error.message });
  }
});

// 📌 Delete Product (Admin Only)
router.delete("/:id", authenticate, checkRole("admin"), async (req, res) => {
  try {
    await deleteProduct(req, res);
  } catch (error) {
    res.status(500).json({ message: "Failed to delete product", error: error.message });
  }
});

module.exports = router;

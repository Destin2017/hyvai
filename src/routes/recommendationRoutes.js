const express = require("express");
const router = express.Router();
const checkRole = require("../middlewares/roleMiddleware");
const { getTopProducts,markProductAsRecommended,toggleProductRecommendation } = require("../controllers/recommendationController");
const { authenticate } = require("../middlewares/authMiddleware");

router.get("/top-products", authenticate, checkRole('admin'), getTopProducts);

// 🔄 Toggle recommend status
router.post("/toggle", authenticate, checkRole('admin'),toggleProductRecommendation);
module.exports = router;


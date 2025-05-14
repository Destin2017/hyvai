// routes/mlRoutes.js
const express = require('express');
const { authenticate } = require("../middlewares/authMiddleware");
const checkRole = require("../middlewares/roleMiddleware");
const mlController = require("../controllers/mlController");

const router = express.Router();

console.log("🔮 ML Routes Loaded");

// ✅ GET Admin View Dataset
router.get('/dataset', authenticate, checkRole('admin'), mlController.getMLDataset);

// ✅ POST Predictive Risk Request
router.post('/predict', authenticate, checkRole('admin'), mlController.predictRisk);

module.exports = router;

const express = require('express');
const { 
    applyForInstallment, 
    getInstallments, 
    getInstallmentPlan,
    updateInstallmentStatus,
    checkInstallmentStatus,
    getPaymentHistory,
    getRejectedInstallments,
    getScoreHistory,
    recordScoreOncePerDay,
    calculateAndStoreScore,
    checkEmployeeEligibility 
} = require('../controllers/installmentController');

const { authenticate } = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');

const router = express.Router();

// ✅ Log incoming API calls for debugging
// ✅ Log incoming API calls for debugging
router.use((req, res, next) => {
    console.log(`📩 Installment API Request: ${req.method} ${req.path}`);
    console.log("🔹 Query Params:", req.query);
    console.log("🔹 Body:", JSON.stringify(req.body, null, 2));
    console.log("🔹 Headers:", req.headers);
    next();
});


// ✅ Employee applies for an installment (Ensures user is authenticated)
router.post('/apply', authenticate, applyForInstallment);

router.post("/api/scores/save", authenticate, recordScoreOncePerDay);

// ✅ Get active installment plan for logged-in employee
router.get('/plan', authenticate, getInstallmentPlan);

// ✅ Admin retrieves all installment applications
router.get('/', authenticate, checkRole('admin'), getInstallments);

// ✅ Admin updates installment status (approve/reject)
router.put('/:id/status', authenticate, checkRole('admin'), updateInstallmentStatus);

// ✅ Check Employee Installment Eligibility
router.get('/eligibility', authenticate, checkEmployeeEligibility);
// ✅ New API to check if employee can apply for a new installment
router.get("/status", authenticate, checkInstallmentStatus);
router.get("/history", authenticate, getPaymentHistory);
// 📌 Get Rejected Installments for Employee
router.get("/rejected", authenticate, getRejectedInstallments);
router.get("/score-history", authenticate, getScoreHistory);
// Add this route:
router.post("/calculate-score", authenticate, calculateAndStoreScore);


module.exports = router;

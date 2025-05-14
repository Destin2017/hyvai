const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');
const adminController = require('../controllers/adminController');
const { getAdminLogs } = require('../controllers/adminController');


const router = express.Router();

//  Ensure all routes are correctly registered
console.log(" Admin Routes Loaded");

//  Admin-only routes (Must be authenticated & have 'admin' role)

//  Fetch all users
router.get('/users', authenticate, checkRole('admin'), adminController.getAllUsers);

//  Fetch all installment applications
router.get('/installments', authenticate, checkRole('admin'), adminController.getAllInstallments);

//  Approve or reject an installment
router.patch('/installments/:id/status', authenticate, checkRole('admin'), adminController.updateInstallmentStatus);

//  Fetch all companies
router.get('/companies', authenticate, checkRole('admin'), adminController.getAllCompanies);

//  Create a new company
router.post('/companies', authenticate, checkRole('admin'), adminController.createCompany);

//  Update company risk category
router.patch('/companies/:company_id/risk', authenticate, checkRole('admin'), adminController.updateCompanyRisk);

router.get('/dashboard-insights', authenticate, checkRole('admin'), adminController.getDashboardInsights);

router.put("/installments/:id", authenticate,checkRole('admin'), adminController.updateInstallment);

// =======================
// 📊 Dashboard & Analytics
// =======================

router.get('/dashboard-insights', authenticate, checkRole('admin'), adminController.getDashboardInsights);
router.get('/analytics', authenticate, checkRole('admin'), adminController.getCompanyAnalytics);
router.get('/analytics/employees', authenticate, checkRole('admin'), adminController.getEmployeeAnalytics);

router.get("/logs", authenticate, checkRole("admin"), getAdminLogs);

// User Management routes
router.get("/users", authenticate, checkRole('admin'),adminController.getAllUsersForSuperAdmin);
router.put("/users/:id", authenticate, checkRole('admin'), adminController.updateUserBySuperAdmin);


  

// =======================
// ⛔ Admin logs
// =======================



module.exports = router;

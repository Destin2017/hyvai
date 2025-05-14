const express = require('express');
const { createTransaction, getTransactions, processPayrollDeduction, sendPaymentReminder } = require('../controllers/paymentController');
const { authenticate } = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');

const router = express.Router();

// Employees can view their transactions
router.get('/', authenticate, getTransactions);

// Admin creates a transaction for an employee installment
router.post('/create', authenticate, checkRole('admin'), createTransaction);

// Employees process payroll deduction for installment
router.post('/payroll-deduct', authenticate, processPayrollDeduction);

// Admin or System sends a payment reminder
router.post('/send-reminder', authenticate, checkRole('admin'), sendPaymentReminder);

module.exports = router;

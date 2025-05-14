const db = require('../config/db');

// Create Transactions for Installment Payments
exports.createTransaction = async (req, res) => {
  const { installment_application_id, amount, due_date } = req.body;

  try {
    await db.execute(
      `INSERT INTO transactions (installment_application_id, amount, due_date) 
       VALUES (?, ?, ?)`,
      [installment_application_id, amount, due_date]
    );

    res.status(201).json({ message: "Transaction created successfully" });
  } catch (err) {
    console.error("❌ Error creating transaction:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get Employee Transactions
exports.getTransactions = async (req, res) => {
  const user_id = req.user.id;

  try {
    const [transactions] = await db.execute(
      `SELECT t.*, i.product_id FROM transactions t
       JOIN installment_applications i ON t.installment_application_id = i.id
       WHERE i.user_id = ?`,
      [user_id]
    );

    res.json(transactions);
  } catch (err) {
    console.error("❌ Error fetching transactions:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Process Payroll Deduction for Installments
exports.processPayrollDeduction = async (req, res) => {
  const { transaction_id } = req.body;
  const user_id = req.user.id;

  try {
    await db.execute(
      `INSERT INTO payroll_deductions (user_id, transaction_id, deduction_status)
       VALUES (?, ?, 'processed')`,
      [user_id, transaction_id]
    );

    await db.execute(
      `UPDATE transactions SET payment_status = 'paid', paid_at = NOW() WHERE id = ?`,
      [transaction_id]
    );

    res.json({ message: "Payroll deduction processed" });
  } catch (err) {
    console.error("❌ Error processing payroll deduction:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Send Payment Reminder
exports.sendPaymentReminder = async (req, res) => {
  const { transaction_id } = req.body;

  try {
    await db.execute(
      `INSERT INTO payment_reminders (transaction_id, status)
       VALUES (?, 'sent')`,
      [transaction_id]
    );

    res.json({ message: "Payment reminder sent successfully" });
  } catch (err) {
    console.error("❌ Error sending payment reminder:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

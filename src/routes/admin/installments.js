const express = require("express");
const router = express.Router();
const db = require("../../config/db");
const { authenticate, isAdmin } = require("../../middleware/authMiddleware");

// 📌 GET all installment applications grouped by company
router.get("/", authenticate, isAdmin, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT i.id, i.user_id, u.name AS user_name, u.company, 
             i.status, i.upfront_payment_status, i.second_payment_status, i.third_payment_status
      FROM installment_applications i
      JOIN users u ON i.user_id = u.id
      ORDER BY u.company, i.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ Failed to fetch admin installment data:", err);
    res.status(500).json({ message: "Error loading installment applications." });
  }
});

// 📌 PUT - Admin update of payment & status fields
router.put("/:id", authenticate, isAdmin, async (req, res) => {
  const { id } = req.params;
  const {
    status,
    upfront_payment_status,
    second_payment_status,
    third_payment_status,
  } = req.body;

  try {
    const query = `
      UPDATE installment_applications SET 
        status = ?, 
        upfront_payment_status = ?, 
        second_payment_status = ?, 
        third_payment_status = ? 
      WHERE id = ?
    `;
    const values = [
      status,
      upfront_payment_status,
      second_payment_status,
      third_payment_status,
      id
    ];

    await db.execute(query, values);
    res.json({ message: "✅ Installment updated successfully." });
  } catch (err) {
    console.error("❌ Admin update error:", err);
    res.status(500).json({ message: "Error updating installment record." });
  }
});

module.exports = router;

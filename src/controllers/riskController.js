const db = require('../config/db');

// Utility: Risk classification logic
const classifyRisk = (missed, overdueDays) => {
  if (missed >= 2 || overdueDays > 15) return 'high';
  if (missed === 1 || overdueDays > 7) return 'medium';
  return 'low';
};

// 📊 Overview stats for dashboard
exports.getRiskOverview = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN upfront_payment_status = 'missed' OR second_payment_status = 'missed' OR third_payment_status = 'missed' THEN 1 ELSE 0 END) AS risky_count,
        SUM(CASE WHEN status = 'approved' AND 
            (DATEDIFF(NOW(), upfront_payment_date) BETWEEN 25 AND 30 OR DATEDIFF(NOW(), upfront_payment_date) BETWEEN 55 AND 60) 
          THEN 1 ELSE 0 END) AS upcoming_dues
      FROM installment_applications
    `);
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ getRiskOverview error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 📋 Detailed risky installments
exports.getRiskInstallments = async (req, res) => {
  const { company_id } = req.query;

  try {
    const whereClause = company_id ? 'AND c.id = ?' : '';
    const params = company_id ? [company_id] : [];

    const [rows] = await db.execute(`
      SELECT 
        i.*, u.name AS user_name, u.phone, c.name AS company_name,
        DATEDIFF(NOW(), upfront_payment_date) AS days_since_upfront,
        (
          (upfront_payment_status = 'missed') +
          (second_payment_status = 'missed') +
          (third_payment_status = 'missed')
        ) AS missed_count
      FROM installment_applications i
      JOIN users u ON i.user_id = u.id
      JOIN companies c ON u.company_id = c.id
      WHERE i.status = 'approved' ${whereClause}
    `, params);

    const results = rows.map(r => ({
      ...r,
      risk_level: classifyRisk(r.missed_count, r.days_since_upfront || 0),
    }));

    res.json(results);
  } catch (err) {
    console.error("❌ getRiskInstallments error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 🛡️ Escalate case (Secure: only destin@gmail.com can assign)
exports.createEscalation = async (req, res) => {
  const { installment_id, assigned_to, method, notes } = req.body;

  console.log("📥 Escalation Attempt By:", req.user); // Make sure email exists!

  // Only destin can assign
  if (req.user.email !== "destin@gmail.com") {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    await db.execute(`
      INSERT INTO escalation_logs (installment_id, assigned_to, method, notes, created_by)
      VALUES (?, ?, ?, ?, ?)
    `, [installment_id, assigned_to, method, notes || null, req.user.id]);

    res.status(201).json({ message: "✅ Escalation saved" });
  } catch (err) {
    console.error("❌ DB Insert Failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 🗂️ Escalation logs
exports.getEscalationLogs = async (req, res) => {
  const { installment_id } = req.params;

  try {
    const [logs] = await db.execute(`
      SELECT * FROM escalation_logs
      WHERE installment_id = ?
      ORDER BY created_at DESC
    `, [installment_id]);

    res.json(logs);
  } catch (err) {
    console.error("❌ getEscalationLogs error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 👤 Get all admins excluding destin@gmail.com
// 
exports.getEscalatableAdmins = async (req, res) => {
  try {
    const [admins] = await db.execute(`
      SELECT id, name FROM users 
      WHERE role = 'admin' AND email != 'destin@gmail.com'
    `);
    res.json(admins); // correct ✅
  } catch (err) {
    console.error("❌ getEscalatableAdmins error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 🔐 Returns the current logged-in user's profile (email, name)
exports.getCurrentUserProfile = async (req, res) => {
    try {
      const [rows] = await db.execute(`
        SELECT id, name, email, role FROM users WHERE id = ?
      `, [req.user.id]);
  
      if (!rows.length) {
        return res.status(404).json({ error: "User not found" });
      }
  
      res.json(rows[0]);
    } catch (err) {
      console.error("❌ getCurrentUserProfile error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // 👤 Return current authenticated admin
exports.getMe = async (req, res) => {
  const { id, name, email, role } = req.user;
  res.json({ id, name, email, role });
};

  
const db = require('../config/db');
const { calculateRiskScore } = require('../utils/riskAnalysis');
const bcrypt = require("bcryptjs");


// 🧠 Central logging util
async function logAdminAction({ admin_id, action, module, description }) {
  try {
    await db.execute(
      `INSERT INTO system_logs (admin_id, action, module, description) VALUES (?, ?, ?, ?)`,
      [admin_id, action, module, description]
    );
  } catch (err) {
    console.error("❌ Failed to log admin action:", err);
  }
}

// =========================
// 🏢 Companies
// =========================

const getAllCompanies = async (req, res) => {
  try {
    const [companies] = await db.execute(`
      SELECT id, name, risk_category, risk_score FROM companies
    `);
    await logAdminAction({
      admin_id: req.user.id,
      action: "Viewed all companies",
      module: "Companies",
      description: "Fetched list of all companies and risk ratings"
    });
    res.json(companies);
  } catch (err) {
    console.error("❌ Error fetching companies:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const createCompany = async (req, res) => {
  const { name, risk_category } = req.body;
  if (!name || !['low', 'medium', 'high'].includes(risk_category)) {
    return res.status(400).json({ message: "Invalid company data" });
  }

  try {
    await db.execute(`
      INSERT INTO companies (name, risk_category, risk_score) VALUES (?, ?, 0)
    `, [name, risk_category]);

    await logAdminAction({
      admin_id: req.user.id,
      action: "Created new company",
      module: "Companies",
      description: `Company "${name}" with risk: ${risk_category}`
    });

    res.status(201).json({ message: "✅ Company added successfully!" });
  } catch (err) {
    console.error("❌ Error creating company:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateCompanyRisk = async (req, res) => {
  const { company_id } = req.params;
  const { risk_category } = req.body;
  if (!['low', 'medium', 'high'].includes(risk_category)) {
    return res.status(400).json({ message: "Invalid risk category" });
  }

  try {
    const [result] = await db.execute(`
      UPDATE companies SET risk_category = ? WHERE id = ?
    `, [risk_category, company_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Company not found" });
    }

    await logAdminAction({
      admin_id: req.user.id,
      action: "Updated company risk",
      module: "Companies",
      description: `Company ID ${company_id} updated to risk: ${risk_category}`
    });

    res.json({ message: `✅ Company risk updated to ${risk_category}` });
  } catch (err) {
    console.error("❌ Error updating company risk:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// =========================
// 👤 Users
// =========================

const getAllUsers = async (req, res) => {
  try {
    const [users] = await db.execute(`
      SELECT u.id, u.name, u.email, u.role, u.status,
             c.name AS company_name, c.risk_category
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
    `);

    await logAdminAction({
      admin_id: req.user.id,
      action: "Viewed all users",
      module: "Users",
      description: "Fetched all user records with associated company data"
    });

    res.json(users);
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// =========================
// 💳 Installments
// =========================

const getAllInstallments = async (req, res) => {
  try {
    const [installments] = await db.execute(`
      SELECT i.*, u.name AS user_name, u.company_id,
             c.name AS company_name, c.risk_category,
             p.name AS product_name
      FROM installment_applications i
      JOIN users u ON i.user_id = u.id
      JOIN products p ON i.product_id = p.id
      JOIN companies c ON u.company_id = c.id
    `);

    await logAdminAction({
      admin_id: req.user.id,
      action: "Fetched all installments",
      module: "Installments",
      description: "Full list of installments including user & product info"
    });

    res.json(installments);
  } catch (err) {
    console.error("❌ Error fetching installments:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateInstallment = async (req, res) => {
  const { id } = req.params;
  const {
    status,
    upfront_payment_status,
    second_payment_status,
    third_payment_status,
  } = req.body;

  try {
    const [rows] = await db.execute(`SELECT * FROM installment_applications WHERE id = ?`, [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Installment not found." });

    const current = rows[0];

    let updatedStatus = status ?? current.status;
    let updatedUpfront = upfront_payment_status ?? current.upfront_payment_status;
    let updatedSecond = second_payment_status ?? current.second_payment_status;
    let updatedThird = third_payment_status ?? current.third_payment_status;

    if (updatedStatus === "rejected") {
      updatedUpfront = "pending";
      updatedSecond = "due";
      updatedThird = "due";
    }

    if (current.upfront_payment_status !== "paid" && updatedUpfront === "paid") {
      updatedSecond = "due";
      updatedThird = "due";
    }

    if (updatedUpfront === "paid" && updatedSecond === "paid" && updatedThird === "paid") {
      updatedStatus = "completed";
    }

    await db.execute(`
      UPDATE installment_applications
      SET status = ?, 
          upfront_payment_status = ?, 
          second_payment_status = ?, 
          third_payment_status = ?
      WHERE id = ?
    `, [updatedStatus, updatedUpfront, updatedSecond, updatedThird, id]);

    await logAdminAction({
      admin_id: req.user.id,
      action: "Updated installment",
      module: "Installments",
      description: `Installment ${id} updated with new status: ${updatedStatus}`
    });

    res.json({ message: "✅ Installment updated successfully" });
  } catch (err) {
    console.error("❌ Error updating installment:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// =========================
// ✅ AI Risk Approval
// =========================

const updateInstallmentStatus = async (req, res) => {
  const { id } = req.params;
  const { status, rejection_reason } = req.body;
  const approved_by = req.user.id;

  try {
    const [installment] = await db.execute(`
      SELECT i.*, u.company_id, u.risk_score, c.risk_category
      FROM installment_applications i
      JOIN users u ON i.user_id = u.id
      JOIN companies c ON u.company_id = c.id
      WHERE i.id = ? AND i.status = "pending"
    `, [id]);

    if (installment.length === 0) {
      return res.status(404).json({ message: "Installment not found or already processed." });
    }

    const newRisk = await calculateRiskScore(installment[0].user_id, installment[0].company_id);

    if (newRisk > 8) {
      return res.status(403).json({ message: "High-risk employee. Cannot approve." });
    }

    if (installment[0].risk_category === 'high') {
      return res.status(403).json({ message: "High-risk company. Cannot approve." });
    }

    const [txn] = await db.execute(`
      SELECT SUM(amount) AS total_paid
      FROM transactions
      WHERE installment_application_id = ? AND payment_status = 'paid'
    `, [id]);

    const totalPaid = txn[0]?.total_paid || 0;
    const required = parseFloat(installment[0].first_payment);

    if (status === "approved") {
      if (totalPaid < required) {
        return res.status(400).json({ message: `Upfront not met. Required: ${required}` });
      }

      await db.execute(`
        UPDATE installment_applications
        SET status = ?, approved_by = ?
        WHERE id = ?
      `, [status, approved_by, id]);

    } else if (status === "rejected") {
      await db.execute(`
        UPDATE installment_applications
        SET status = ?, rejection_reason = ?
        WHERE id = ?
      `, [status, rejection_reason, id]);
    } else {
      return res.status(400).json({ message: "Invalid status." });
    }

    await logAdminAction({
      admin_id: approved_by,
      action: `Installment ${status}`,
      module: "Installments",
      description: `Installment ID ${id} marked as ${status}`
    });

    res.json({ message: `✅ Installment ${status}` });
  } catch (err) {
    console.error("❌ Approval error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// =========================
// 📊 Analytics with Logging
// =========================

const getCompanyAnalytics = async (req, res) => {
  const { company_id, start_date, end_date } = req.query;

  try {
    let filters = "WHERE 1=1";
    const params = [];

    if (company_id) {
      filters += " AND u.company_id = ?";
      params.push(company_id);
    }

    if (start_date && end_date) {
      filters += " AND i.created_at BETWEEN ? AND ?";
      params.push(start_date, end_date);
    }

    const [stats] = await db.execute(`
      SELECT 
        c.id AS company_id,
        c.name AS company_name,
        COUNT(i.id) AS total_installments,
        SUM(CASE WHEN i.upfront_payment_status = 'paid' THEN i.first_payment ELSE 0 END) AS upfront_paid,
        SUM(CASE WHEN i.second_payment_status = 'paid' THEN i.second_payment ELSE 0 END) AS second_paid,
        SUM(CASE WHEN i.third_payment_status = 'paid' THEN i.third_payment ELSE 0 END) AS third_paid
      FROM installment_applications i
      JOIN users u ON i.user_id = u.id
      JOIN companies c ON u.company_id = c.id
      ${filters}
      GROUP BY c.id
    `, params);

    await logAdminAction({
      admin_id: req.user.id,
      action: "Viewed company analytics",
      module: "Analytics",
      description: "Fetched data on payment performance per company"
    });

    res.json(stats);
  } catch (err) {
    console.error("❌ Analytics error:", err);
    res.status(500).json({ error: "Failed to load analytics data" });
  }
};

const getEmployeeAnalytics = async (req, res) => {
  const { company_id, start_date, end_date } = req.query;

  try {
    let filters = "WHERE 1=1";
    const params = [];

    if (company_id) {
      filters += " AND u.company_id = ?";
      params.push(company_id);
    }

    if (start_date && end_date) {
      filters += " AND i.created_at BETWEEN ? AND ?";
      params.push(start_date, end_date);
    }

    const [rows] = await db.execute(`
      SELECT 
        u.id AS user_id,
        u.name,
        SUM(CASE WHEN i.upfront_payment_status = 'paid' THEN i.first_payment ELSE 0 END) AS upfront,
        SUM(CASE WHEN i.second_payment_status = 'paid' THEN i.second_payment ELSE 0 END) AS second,
        SUM(CASE WHEN i.third_payment_status = 'paid' THEN i.third_payment ELSE 0 END) AS third
      FROM installment_applications i
      JOIN users u ON i.user_id = u.id
      ${filters}
      GROUP BY u.id
      ORDER BY u.name ASC
    `, params);

    await logAdminAction({
      admin_id: req.user.id,
      action: "Viewed employee analytics",
      module: "Analytics",
      description: "Aggregated installment totals by employee"
    });

    res.json(rows);
  } catch (err) {
    console.error("❌ Employee analytics error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Restored + Logging
const getDashboardInsights = async (req, res) => {
  try {
    const [scoreStats] = await db.execute(`
      SELECT 
        COUNT(DISTINCT u.id) AS total_employees,
        ROUND(AVG(sh.score), 2) AS avg_score,
        MAX(sh.score) AS max_score,
        MIN(sh.score) AS min_score
      FROM users u
      JOIN score_history sh ON u.id = sh.user_id
    `);

    const [topPerformers] = await db.execute(`
      SELECT u.id, u.name, MAX(sh.score) AS latest_score
      FROM users u
      JOIN score_history sh ON u.id = sh.user_id
      GROUP BY u.id
      ORDER BY latest_score DESC
      LIMIT 5
    `);

    const [riskyUsers] = await db.execute(`
      SELECT u.id, u.name, MAX(sh.score) AS latest_score
      FROM users u
      JOIN score_history sh ON u.id = sh.user_id
      GROUP BY u.id
      HAVING latest_score < 30
      ORDER BY latest_score ASC
      LIMIT 5
    `);

    const [discountEligible] = await db.execute(`
      SELECT u.id, u.name, MAX(sh.score) AS latest_score
      FROM users u
      JOIN score_history sh ON u.id = sh.user_id
      GROUP BY u.id
      HAVING latest_score >= 80
    `);

    const [installmentStats] = await db.execute(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
        SUM(CASE WHEN upfront_payment_status = 'paid' THEN 1 ELSE 0 END) AS upfront_paid,
        SUM(CASE WHEN second_payment_status = 'missed' OR third_payment_status = 'missed' THEN 1 ELSE 0 END) AS missed_payments
      FROM installment_applications
    `);

    await logAdminAction({
      admin_id: req.user.id,
      action: "Viewed dashboard insights",
      module: "Dashboard",
      description: "Summary view of employee performance and installment stats"
    });

    res.json({
      scoreStats: scoreStats[0],
      topPerformers,
      riskyUsers,
      discountEligible,
      installmentStats: installmentStats[0]
    });
  } catch (err) {
    console.error("❌ Dashboard error:", err);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
};

// 📜 Admin Logs (super-admin only)
const getAdminLogs = async (req, res) => {
  try {
    const superAdminEmail = "destin@gmail.com";
    if (!req.user || req.user.email !== superAdminEmail) {
      return res.status(403).json({ error: "Access denied. Only authorized admin can view logs." });
    }

    const [logs] = await db.execute(`
      SELECT 
        l.id,
        u.name AS admin_name,
        u.email,
        l.action,
        l.module,
        l.description,
        l.created_at
      FROM system_logs l
      JOIN users u ON l.admin_id = u.id
      ORDER BY l.created_at DESC
      LIMIT 100
    `);

    res.status(200).json(logs);
  } catch (err) {
    console.error("❌ Failed to fetch admin logs:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 🧠 Only superadmin can access this
const SUPER_ADMIN_EMAIL = "destin@gmail.com";

// 🔍 Get All Users
const getAllUsersForSuperAdmin = async (req, res) => {
  try {
    if (req.user.email !== SUPER_ADMIN_EMAIL) {
      return res.status(403).json({ error: "Access denied" });
    }

    const [users] = await db.execute(`
      SELECT id, name, email, role FROM users
    `);

    res.json(users);
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// 🛠 Update User by Super Admin
const updateUserBySuperAdmin = async (req, res) => {
  const { id } = req.params;
  const { name, role, password } = req.body;

  if (req.user.email !== SUPER_ADMIN_EMAIL) {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    let updateQuery = "UPDATE users SET name = ?, role = ?";
    let params = [name, role];

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters." });
      }

      const hashed = await bcrypt.hash(password, 12);
      updateQuery += ", password = ?";
      params.push(hashed);
    }

    updateQuery += " WHERE id = ?";
    params.push(id);

    await db.execute(updateQuery, params);
    res.json({ message: "✅ User updated successfully" });
  } catch (err) {
    console.error("❌ Error updating user:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
};

// =========================
// EXPORT
// =========================

module.exports = {
  getAllCompanies,
  createCompany,
  updateCompanyRisk,
  getAllUsers,
  getAllInstallments,
  updateInstallment,
  updateInstallmentStatus,
  getCompanyAnalytics,
  getEmployeeAnalytics,
  getDashboardInsights,
  getAdminLogs,
  getAllUsersForSuperAdmin,
  updateUserBySuperAdmin
};

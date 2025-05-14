const db = require('../config/db');

exports.logAction = async ({ adminId, action, module, description }) => {
  try {
    await db.execute(
      `INSERT INTO system_logs (admin_id, action, module, description) VALUES (?, ?, ?, ?)`,
      [adminId, action, module, description]
    );
  } catch (err) {
    console.error("❌ Failed to log action:", err);
  }
};

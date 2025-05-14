const db = require("../config/db");
const axios = require("axios");

// 📊 1. Get Aggregated Dataset for Admin Predictive View
exports.getMLDataset = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        u.id AS user_id,
        u.name,
        u.role,
        u.company_id,
        c.name AS company_name,
        c.risk_category,
        COUNT(DISTINCT s.id) AS score_count,
        AVG(s.score) AS avg_score,
        STDDEV(s.score) AS score_stddev,
        SUM(CASE WHEN i.second_payment_status = 'missed' THEN 1 ELSE 0 END) +
        SUM(CASE WHEN i.third_payment_status = 'missed' THEN 1 ELSE 0 END) AS missed_payments,
        SUM(CASE WHEN i.second_payment_status = 'paid' THEN 1 ELSE 0 END) +
        SUM(CASE WHEN i.third_payment_status = 'paid' THEN 1 ELSE 0 END) AS ontime_payments,
        TIMESTAMPDIFF(DAY, MIN(s.recorded_at), MAX(s.recorded_at)) AS span_days
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      LEFT JOIN score_history s ON u.id = s.user_id
      LEFT JOIN installment_applications i ON u.id = i.user_id
      GROUP BY u.id
    `);

    res.json(rows);
  } catch (err) {
    console.error("❌ Error building ML dataset:", err);
    res.status(500).json({ message: "Failed to prepare dataset" });
  }
};

// 🔮 2. Predictive Risk via ML Model API
exports.predictRisk = async (req, res) => {
  try {
    const { users } = req.body;

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ message: "Invalid data format: expecting an array of users" });
    }

    // Prepare records for ML
    const mlResponse = await axios.post("http://localhost:8000/predict-risk", {
      users
    });

    const predictions = mlResponse.data;

    // Match prediction back to user
    const enriched = users.map(user => {
      const result = predictions.find(p => p.user_id === user.user_id);
      return {
        ...user,
        predicted_risk: result?.predicted_risk || "unknown",
        confidence: result?.confidence || null,
      };
    });

    res.json({ predictions: enriched });

  } catch (err) {
    console.error("🔥 ML Prediction Error:", err.message);
    res.status(500).json({ message: "Prediction failed. Check ML server or input." });
  }
};

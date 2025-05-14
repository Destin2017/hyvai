// utils/predictUserRisk.js

/**
 * Simulate risk prediction based on employee behavior
 * @param {Object} user - user profile with score and history
 * @returns {Object} - predicted risk score (0-100) and category
 */
function predictUserRisk(user) {
    const {
      avg_score = 0,
      score_stddev = 0,
      missed_payments = 0,
      ontime_payments = 0,
      span_days = 0,
    } = user;
  
    const normalizedScore = Math.min(100, Math.max(0, Number(avg_score)));
    const volatility = Number(score_stddev);
    const missed = Number(missed_payments);
    const ontime = Number(ontime_payments);
  
    // Simple weighted formula for risk score (0 = low risk, 100 = high risk)
    let riskScore = 50;
  
    riskScore -= normalizedScore * 0.5; // Higher score lowers risk
    riskScore += volatility * 1.2;      // More volatility = higher risk
    riskScore += missed * 10;           // Missed payments drastically increase risk
    riskScore -= ontime * 2;            // On-time lowers risk
    riskScore += span_days < 30 ? 10 : 0; // Very short history = more uncertain
  
    riskScore = Math.max(0, Math.min(100, riskScore)); // clamp between 0-100
  
    let riskCategory = "medium";
    if (riskScore >= 70) riskCategory = "high";
    else if (riskScore <= 35) riskCategory = "low";
  
    return {
      predicted_score: Math.round(riskScore),
      predicted_category: riskCategory,
    };
  }
  
  module.exports = { predictUserRisk };
  
const db = require('../config/db');

exports.calculateRiskScore = async (userId, companyId) => {
  try {
    console.log(` Calculating risk score for User ID: ${userId}, Company ID: ${companyId}`);

    // Fetch installment history (all statuses)
    const [installments] = await db.execute(`
      SELECT status, first_payment, second_payment, third_payment 
      FROM installment_applications 
      WHERE user_id = ?`, [userId]);

    // Count rejected applications for the employee
    const rejectedInstallments = installments.filter(i => i.status === 'rejected').length;

    // Count on-time payments
    const [onTimePayments] = await db.execute(`
      SELECT COUNT(*) AS on_time FROM transactions 
      WHERE user_id = ? AND payment_status = 'paid'`, [userId]);

    // Count missed payments
    const [missedPayments] = await db.execute(`
      SELECT COUNT(*) AS missed FROM transactions 
      WHERE user_id = ? AND payment_status = 'missed'`, [userId]);

    // Count company-wide rejected applications
    const [companyRejections] = await db.execute(`
      SELECT COUNT(*) AS rejected_count FROM installment_applications 
      WHERE status = 'rejected' AND user_id IN 
      (SELECT id FROM users WHERE company_id = ?)`, [companyId]);

    //  Risk Calculation Formula
    let riskScore = 0;

    //  Individual Employee Risk Factors
    riskScore += rejectedInstallments * 3; // Higher risk if employee has rejected applications
    riskScore += missedPayments[0].missed * 4; // Critical risk for missed payments
    riskScore -= onTimePayments[0].on_time * 1.5; // Reduce risk for good payment history (if applicable)

    //  Company Risk Factor
    if (companyRejections[0].rejected_count > 5) {
      riskScore += 5; // Increase risk if company has a history of rejected applications
    }

    //  Normalize risk score between 0 and 10
    riskScore = Math.max(0, Math.min(10, riskScore));

    // 🛠️ Update Risk Score in DB
    await db.execute(`UPDATE users SET risk_score = ? WHERE id = ?`, [riskScore, userId]);
    await db.execute(`UPDATE companies SET risk_score = ? WHERE id = ?`, [riskScore, companyId]);

    console.log(` Final Risk Score for User ${userId}: ${riskScore}`);
    return riskScore;

  } catch (err) {
    console.error("❌ Error calculating risk score:", err);
    return 10; // Default to HIGH RISK if something goes wrong
  }
};

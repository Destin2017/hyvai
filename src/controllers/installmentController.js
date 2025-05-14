const db = require("../config/db");

// 📌 Apply for Installment (Employees Only)
// 📌 Apply for Installment (Employees Only)
// 📌 Apply for Installment (Employees Only)
const applyForInstallment = async (req, res) => {
    const { product_id } = req.body;
    const user_id = req.user?.id;

    console.log("🔍 Debugging Installment Apply Request:", { user_id, product_id });

    if (!user_id || !product_id) {
        console.error("❌ Missing required fields:", { user_id, product_id });
        return res.status(400).json({ message: "❌ Missing required fields." });
    }

    try {
        // ✅ Step 1: Check if user has an installment where all payments are "paid"
        await db.execute(
            `UPDATE installment_applications 
             SET status = 'completed' 
             WHERE user_id = ? 
             AND upfront_payment_status = 'paid' 
             AND second_payment_status = 'paid' 
             AND third_payment_status = 'paid'`,
            [user_id]
        );

        // ✅ Step 2: Check if the employee still has an active (not completed) installment
        const [activeInstallments] = await db.execute(
            "SELECT id FROM installment_applications WHERE user_id = ? AND status != 'completed'",
            [user_id]
        );

        if (activeInstallments.length > 0) {
            console.warn("🚫 Employee already has an active installment. Cannot apply for another.");
            return res.status(400).json({ message: "🚫 You already have an active installment. Cannot apply for another." });
        }

        // ✅ Step 3: Fetch Product Price
        const [product] = await db.execute("SELECT price FROM products WHERE id = ?", [product_id]);
        if (product.length === 0) {
            console.error("❌ Product not found:", product_id);
            return res.status(404).json({ message: "❌ Product not found" });
        }

        const price = parseFloat(product[0].price);
        const first_payment = (price * 0.60).toFixed(2);
        const second_payment = (price * 0.25).toFixed(2);
        const third_payment = (price * 0.15).toFixed(2);

        console.log("📊 Calculated Payments:", { first_payment, second_payment, third_payment });

        // ✅ Step 4: Insert Installment Application
        const [installment] = await db.execute(
            `INSERT INTO installment_applications 
            (user_id, product_id, first_payment, upfront_payment_status, second_payment, second_payment_status, third_payment, third_payment_status, status) 
            VALUES (?, ?, ?, 'pending', ?, 'due', ?, 'due', 'pending')`,
            [user_id, product_id, first_payment, second_payment, third_payment]
        );

        console.log("✅ Installment application successfully saved:", installment);

        res.status(201).json({
            message: "✅ Installment application submitted. Please wait for approval.",
            installment_id: installment.insertId
        });

    } catch (err) {
        console.error("❌ Error applying for installment:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


// ✅ Get Installment Plan for Employee
// ✅ Updated logic to avoid sending fully paid plans
const getInstallmentPlan = async (req, res) => {
    const user_id = req.user.id;
  
    try {
      const [installments] = await db.execute(
        `SELECT i.*, p.name AS product_name, p.price AS product_price
         FROM installment_applications i 
         JOIN products p ON i.product_id = p.id
         WHERE i.user_id = ? 
         AND i.status = 'approved'
         AND (
           i.upfront_payment_status != 'paid' OR 
           i.second_payment_status != 'paid' OR 
           i.third_payment_status != 'paid'
         )
         LIMIT 1`,
        [user_id]
      );
  
      if (installments.length === 0) {
        return res.status(404).json({ message: "❌ No active installment plan found." });
      }
  
      const installment = installments[0];
  
      res.json({
        product: {
          name: installment.product_name,
          price: parseFloat(installment.product_price)
        },
        installmentPlan: {
          initialPayment: {
            amount: parseFloat(installment.first_payment),
            dueDate: "Today",
            status: installment.upfront_payment_status
          },
          secondInstallment: {
            amount: parseFloat(installment.second_payment),
            dueDate: "In 30 days",
            status: installment.second_payment_status
          },
          finalInstallment: {
            amount: parseFloat(installment.third_payment),
            dueDate: "In 60 days",
            status: installment.third_payment_status
          },
        }
      });
  
    } catch (err) {
      console.error("❌ Error fetching installment plan:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  
  
// 📌 Get All Installments (Admin Only)
const getInstallments = async (req, res) => {
    try {
        const [installments] = await db.execute(
            `SELECT i.*, u.name AS user_name, p.name AS product_name 
            FROM installment_applications i 
            JOIN users u ON i.user_id = u.id 
            JOIN products p ON i.product_id = p.id`
        );

        res.json(installments);
    } catch (err) {
        console.error("❌ Error fetching installments:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// 📌 Approve or Reject Installment (Admin Only)
const updateInstallmentStatus = async (req, res) => {
    const { id } = req.params;
    const {
      status,
      rejection_reason,
      upfront_payment_status,
      second_payment_status,
      third_payment_status
    } = req.body;
  
    const approved_by = req.user.id;
  
    try {
      // 1️⃣ Fetch current statuses BEFORE update
      const [existingRows] = await db.execute(
        `SELECT user_id, second_payment_status, third_payment_status FROM installment_applications WHERE id = ?`,
        [id]
      );
      if (existingRows.length === 0) {
        return res.status(404).json({ error: "Installment not found." });
      }
  
      const { user_id, second_payment_status: oldSecond, third_payment_status: oldThird } = existingRows[0];
  
      // 2️⃣ Update installment status
      let query = `UPDATE installment_applications SET 
        status = ?, 
        rejection_reason = ?, 
        approved_by = ?,
        upfront_payment_status = ?,
        second_payment_status = ?,
        third_payment_status = ?`;
  
      const values = [
        status,
        rejection_reason || null,
        approved_by,
        upfront_payment_status,
        second_payment_status,
        third_payment_status
      ];
  
      if (upfront_payment_status === "paid") {
        query += `, upfront_payment_date = NOW()`;
      }
  
      query += ` WHERE id = ?`;
      values.push(id);
  
      await db.execute(query, values);
  
      // 3️⃣ Trigger score recording IF second or third status changed
      const secondChanged = oldSecond !== second_payment_status;
      const thirdChanged = oldThird !== third_payment_status;
  
      if (secondChanged || thirdChanged) {
        console.log("📊 Triggering score update due to payment status change...");
  
        // Recalculate score and record (event-based logic)
        const [rows] = await db.execute(
          `SELECT second_payment_status, third_payment_status 
           FROM installment_applications 
           WHERE user_id = ? AND status = 'completed'`,
          [user_id]
        );
  
        let score = 0;
        rows.forEach(row => {
          const s = row.second_payment_status?.toLowerCase();
          const t = row.third_payment_status?.toLowerCase();
  
          if (s === "paid") score += 15;
          else if (s === "missed") score -= 10;
  
          if (t === "paid") score += 20;
          else if (t === "missed") score -= 15;
        });
  
        // ⛔ Prevent inserting multiple scores in same day
        const [existingScore] = await db.execute(
          `SELECT id FROM score_history WHERE user_id = ? AND DATE(recorded_at) = CURDATE()`,
          [user_id]
        );
  
        if (existingScore.length === 0) {
          await db.execute(
            `INSERT INTO score_history (user_id, score) VALUES (?, ?)`,
            [user_id, score]
          );
          console.log("✅ Score recorded in DB.");
        } else {
          console.log("⚠️ Score already recorded today, skipping insert.");
        }
      }
  
      res.json({ message: `✅ Installment application updated successfully.` });
  
    } catch (err) {
      console.error("❌ Error updating installment status:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  
  
// 📌 Check Employee Eligibility
const checkEmployeeEligibility = async (req, res) => {
    const user_id = req.user.id;
    try {
        const [installments] = await db.execute(
            "SELECT COUNT(*) AS activeInstallments FROM installment_applications WHERE user_id = ? AND status != 'completed'",
            [user_id]
        );
        const isEligible = installments[0].activeInstallments === 0;
        res.json({ isEligible });
    } catch (err) {
        console.error("❌ Error checking eligibility:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// 📌 Check Installment Status Before Applying
const checkInstallmentStatus = async (req, res) => {
    const user_id = req.user.id;

    try {
        console.log(`🔍 Checking installment status for User: ${user_id}`);

        // ✅ Step 1: Automatically mark installment as "completed" if all payments are made
        await db.execute(
            `UPDATE installment_applications 
             SET status = 'completed' 
             WHERE user_id = ? 
             AND upfront_payment_status = 'paid' 
             AND second_payment_status = 'paid' 
             AND third_payment_status = 'paid'`,
            [user_id]
        );

        // ✅ Step 2: Check if the user still has an active (not completed) installment
        const [activeInstallments] = await db.execute(
            "SELECT id FROM installment_applications WHERE user_id = ? AND status != 'completed'",
            [user_id]
        );

        const isEligible = activeInstallments.length === 0;

        res.json({ isEligible });

    } catch (err) {
        console.error("❌ Error checking installment status:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
// 📌 Get Payment History (Completed Installments for Employee)
const getPaymentHistory = async (req, res) => {
    const user_id = req.user.id;

    try {
        console.log(`📩 Fetching completed installments for User: ${user_id}`);

        const [installments] = await db.execute(
            `SELECT i.*, p.name AS product_name, p.price AS product_price
            FROM installment_applications i
            JOIN products p ON i.product_id = p.id
            WHERE i.user_id = ? AND i.status = 'completed'
            ORDER BY i.updated_at DESC`, // Sort by most recent
            [user_id]
        );

        if (installments.length === 0) {
            return res.status(404).json({ message: "No completed installments found." });
        }

        res.json(installments);
    } catch (err) {
        console.error("❌ Error fetching payment history:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
// 📌 Get Rejected Installments (Employee Only)
const getRejectedInstallments = async (req, res) => {
    const user_id = req.user.id;

    try {
        const [rejectedInstallments] = await db.execute(
            `SELECT i.*, p.name AS product_name, p.price AS product_price
             FROM installment_applications i
             JOIN products p ON i.product_id = p.id
             WHERE i.user_id = ? AND i.status = 'rejected'
             ORDER BY i.updated_at DESC`,
            [user_id]
        );

        if (rejectedInstallments.length === 0) {
            return res.status(404).json({ message: "❌ No rejected applications found." });
        }

        res.json(rejectedInstallments);
    } catch (err) {
        console.error("❌ Error fetching rejected applications:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// 🧠 UTIL: Record Score Safely (once/day)
const recordScore = async (user_id, score) => {
    try {
      const [existing] = await db.execute(
        `SELECT id FROM score_history WHERE user_id = ? AND DATE(recorded_at) = CURDATE()`,
        [user_id]
      );
      if (existing.length > 0) {
        console.log("📛 Score already recorded today.");
        return;
      }
  
      await db.execute(
        `INSERT INTO score_history (user_id, score) VALUES (?, ?)`,
        [user_id, score]
      );
      console.log("✅ Score successfully recorded.");
    } catch (err) {
      console.error("❌ Failed to record score:", err.message);
    }
  };
  
  // 📌 Endpoint: Calculate and Record Score (Graph + AI/ML Readiness)
  const calculateAndStoreScore = async (req, res) => {
    const user_id = req.user.id;
    try {
      const [rows] = await db.execute(
        `SELECT second_payment_status, third_payment_status FROM installment_applications 
         WHERE user_id = ? AND status = 'completed'`,
        [user_id]
      );
  
      let score = 0;
      let completed = 0;
  
      rows.forEach((row) => {
        const second = row.second_payment_status?.toLowerCase();
        const third = row.third_payment_status?.toLowerCase();
  
        if (second === "paid") score += 15;
        else if (second === "missed") score -= 10;
  
        if (third === "paid") score += 20;
        else if (third === "missed") score -= 15;
  
        if (second === "paid" && third === "paid") completed += 1;
      });
  
      await recordScore(user_id, score);
  
      res.json({ message: "✅ Score recorded", score });
    } catch (err) {
      console.error("❌ Failed to calculate score:", err);
      res.status(500).json({ error: "Score calculation failed" });
    }
  };
  
  // 📌 Graph Support: Get Score History
  const getScoreHistory = async (req, res) => {
    const user_id = req.user.id;
    try {
      const [rows] = await db.execute(
        `SELECT score, recorded_at FROM score_history WHERE user_id = ? ORDER BY recorded_at ASC`,
        [user_id]
      );
      res.json(rows);
    } catch (err) {
      console.error("❌ Error fetching score history:", err);
      res.status(500).json({ error: "Error retrieving score history" });
    }
  };
  // POST /api/scores/save
const recordScoreOncePerDay = async (req, res) => {
    const user_id = req.user.id;
    const { score } = req.body;
  
    try {
      const [existing] = await db.execute(
        `SELECT id FROM score_history WHERE user_id = ? AND DATE(recorded_at) = CURDATE()`,
        [user_id]
      );
  
      if (existing.length > 0) {
        return res.status(200).json({ message: "Already recorded today" });
      }
  
      await db.execute(
        `INSERT INTO score_history (user_id, score) VALUES (?, ?)`,
        [user_id, score]
      );
  
      res.status(201).json({ message: "Score recorded successfully" });
    } catch (err) {
      console.error("❌ Error recording score:", err);
      res.status(500).json({ message: "Failed to record score" });
    }
  };
  




// ✅ Export All Functions
module.exports = {
    applyForInstallment,
    getInstallments,
    checkInstallmentStatus,
    getInstallmentPlan,
    getPaymentHistory,
    getRejectedInstallments,
    recordScore,
    getScoreHistory,
    recordScoreOncePerDay,
    calculateAndStoreScore,
    updateInstallmentStatus,
    checkEmployeeEligibility
};

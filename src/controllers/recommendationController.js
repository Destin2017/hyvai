const db = require('../config/db');

// 📊 Get Top Products with full enrichment
exports.getTopProducts = async (req, res) => {
  try {
    const [topProducts] = await db.execute(`
      SELECT 
        p.id,
        p.name,
        p.stock,
        p.is_recommended,
        c.name AS category,
        COUNT(i.id) AS order_count,
        (
          SELECT COUNT(*) FROM installment_applications i2
          WHERE i2.product_id = p.id 
            AND i2.status IN ('approved', 'completed') 
            AND i2.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ) AS recent_orders
      FROM installment_applications i
      JOIN products p ON i.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      WHERE i.status IN ('approved', 'completed')
      GROUP BY p.id
      ORDER BY order_count DESC
      LIMIT 5
    `);

    // 🧠 Enrich each product with average risk score, company breakdown, trend
    const enriched = await Promise.all(
      topProducts.map(async (p) => {
        const [[{ avg_risk_score }]] = await db.execute(`
          SELECT AVG(ai_risk_score) AS avg_risk_score
          FROM installment_applications 
          WHERE product_id = ? AND ai_risk_score IS NOT NULL
        `, [p.id]);

        const [companies] = await db.execute(`
          SELECT comp.name, COUNT(*) as count
          FROM installment_applications i
          JOIN users u ON i.user_id = u.id
          JOIN companies comp ON u.company_id = comp.id
          WHERE i.product_id = ? AND i.status IN ('approved', 'completed')
          GROUP BY comp.id
        `, [p.id]);

        const [[{ prev_week_orders }]] = await db.execute(`
          SELECT COUNT(*) AS prev_week_orders
          FROM installment_applications
          WHERE product_id = ? 
            AND status IN ('approved', 'completed')
            AND created_at BETWEEN DATE_SUB(NOW(), INTERVAL 14 DAY)
            AND DATE_SUB(NOW(), INTERVAL 7 DAY)
        `, [p.id]);

        const recent = parseInt(p.recent_orders || 0);
        const previous = parseInt(prev_week_orders || 0);
        const trend = previous > 0 ? Math.round(((recent - previous) / previous) * 100) : 0;

        return {
          id: p.id,
          name: p.name,
          stock: p.stock,
          is_recommended: !!p.is_recommended,
          category: p.category,
          order_count: p.order_count,
          avg_risk_score: avg_risk_score ? parseFloat(avg_risk_score).toFixed(1) : null,
          companies,
          trend
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error("❌ getTopProducts error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 🔁 Toggle product recommendation status
exports.toggleProductRecommendation = async (req, res) => {
  const { productId, isRecommended } = req.body;

  if (!productId || typeof isRecommended === "undefined") {
    return res.status(400).json({ error: "Missing productId or isRecommended in request body." });
  }

  try {
    await db.execute(
      `UPDATE products SET is_recommended = ? WHERE id = ?`,
      [isRecommended ? 1 : 0, productId]
    );

    res.json({
      message: `Product ${isRecommended ? "recommended" : "unrecommended"} successfully`,
      status: isRecommended
    });
  } catch (err) {
    console.error("❌ toggleProductRecommendation error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

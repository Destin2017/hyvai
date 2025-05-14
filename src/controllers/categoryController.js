const db = require("../config/db");

/// 📌 Get all categories
exports.getCategories = async (req, res) => {
    try {
      const connection = await db.getConnection();
      const [categories] = await connection.execute("SELECT * FROM categories");
      connection.release();
      res.json(categories);
    } catch (error) {
      console.error("❌ Error fetching categories:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

// Create a New Category
exports.createCategory = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Category name is required" });

  try {
    const connection = await db.getConnection();
    try {
      await connection.execute("INSERT INTO categories (name) VALUES (?)", [name]);
      res.status(201).json({ message: "Category created successfully" });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update an Existing Category
exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) return res.status(400).json({ message: "Category name is required" });

  try {
    const connection = await db.getConnection();
    try {
      const [result] = await connection.execute("UPDATE categories SET name = ? WHERE id = ?", [name, id]);
      if (result.affectedRows === 0) return res.status(404).json({ message: "Category not found" });
      res.json({ message: "Category updated successfully" });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete a Category
exports.deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const connection = await db.getConnection();
    try {
      const [result] = await connection.execute("DELETE FROM categories WHERE id = ?", [id]);
      if (result.affectedRows === 0) return res.status(404).json({ message: "Category not found" });
      res.json({ message: "Category deleted successfully" });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

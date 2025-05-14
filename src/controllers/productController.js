const db = require("../config/db");

// Get All Products (Supports Multiple Images & Category Filtering)
exports.getProducts = async (req, res) => {
  try {
    const { category } = req.query;
    const connection = await db.getConnection();
    try {
      let query = `
        SELECT products.*, categories.name AS category_name 
        FROM products 
        INNER JOIN categories ON products.category_id = categories.id`;

      let values = [];
      if (category) {
        query += " WHERE categories.name = ?";
        values.push(category);
      }

      const [products] = await connection.execute(query, values);

      // Convert price to a number & convert image string to an array
      const formattedProducts = products.map((product) => ({
        ...product,
        price: Number(product.price),
        images: product.image ? product.image.split(",").map(img => `http://localhost:5000/uploads/${img.trim()}`) : [],
      }));

      res.json(formattedProducts);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// Get Product by ID (Supports Multiple Images)
exports.getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await db.getConnection();
    try {
      const [products] = await connection.execute(
        `SELECT products.*, categories.name AS category_name 
         FROM products 
         INNER JOIN categories ON products.category_id = categories.id 
         WHERE products.id = ?`,
        [id]
      );

      if (products.length === 0) {
        return res.status(404).json({ message: "Product not found" });
      }

      products[0].images = products[0].image
        ? products[0].image.split(",").map(img => `http://localhost:5000/uploads/${img.trim()}`)
        : [];

      res.json(products[0]);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// Create a New Product (Supports Multiple Images)
exports.createProduct = async (req, res) => {
  const { name, description, price, stock, category_id } = req.body;
  const images = req.files ? req.files.map(file => file.filename).join(",") : null;

  if (!name || !price || !category_id) {
    return res.status(400).json({ message: "Name, price, and category are required" });
  }

  try {
    const connection = await db.getConnection();
    try {
      const [result] = await connection.execute(
        "INSERT INTO products (name, description, price, stock, image, category_id) VALUES (?, ?, ?, ?, ?, ?)",
        [name, description, price, stock || 0, images, category_id]
      );

      res.status(201).json({ 
        message: "Product created successfully", 
        productId: result.insertId, 
        images 
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// Update Product (Supports Multiple Image Updates)
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, category_id } = req.body;
  const images = req.files ? req.files.map(file => file.filename).join(",") : null;

  try {
    const connection = await db.getConnection();
    try {
      if (images) {
        await connection.execute(
          "UPDATE products SET name=?, description=?, price=?, stock=?, image=?, category_id=? WHERE id=?",
          [name, description, price, stock, images, category_id, id]
        );
      } else {
        await connection.execute(
          "UPDATE products SET name=?, description=?, price=?, stock=?, category_id=? WHERE id=?",
          [name, description, price, stock, category_id, id]
        );
      }

      res.json({ message: "Product updated successfully", images });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// Delete Product
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const connection = await db.getConnection();
    try {
      const [result] = await connection.execute("DELETE FROM products WHERE id = ?", [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({ message: "Product deleted successfully" });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

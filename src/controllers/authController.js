const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

// 📌 Get All Companies (For registration dropdown)
exports.getCompanies = async (req, res) => {
  try {
    const [companies] = await db.execute("SELECT id, name FROM companies");
    res.json(companies);
  } catch (err) {
    console.error("❌ getCompanies error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 📌 User Registration
exports.register = async (req, res) => {
  const { name, email, password, role = "employee", company_id, phone } = req.body;

  // 🔐 Basic Validation
  if (!name || !email || !password || !company_id || !phone) {
    return res.status(400).json({ message: "All fields are required including phone number." });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters long." });
  }

  try {
    // 🔍 Check if email already exists
    const [existing] = await db.execute("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length) {
      return res.status(400).json({ message: "Email already exists." });
    }

    // 🏢 Validate company
    const [company] = await db.execute("SELECT id FROM companies WHERE id = ?", [company_id]);
    if (!company.length) {
      return res.status(400).json({ message: "Invalid company selected." });
    }

    // 🔑 Hash password
    const hashed = await bcrypt.hash(password, 12);

    // 📝 Save new user with phone
    await db.execute(
      `INSERT INTO users (name, email, phone, password, role, company_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, phone, hashed, role, company_id]
    );

    res.status(201).json({ message: "✅ Registration successful." });
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// 🔐 Login & JWT Auth
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required." });

  try {
    const [users] = await db.execute(
      "SELECT id, name, email, password, role, company_id FROM users WHERE email = ?",
      [email]
    );

    if (!users.length) return res.status(401).json({ message: "Invalid credentials." });

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials." });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email, // ✅ included for escalation verification
        role: user.role,
        company_id: user.company_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company_id: user.company_id,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 🧼 Logout
exports.logout = (req, res) => {
  // Stateless JWT: client-side token clearing is sufficient
  res.json({ message: "Logout successful." });
};

// 🛡️ Middleware: Authenticate token
exports.authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access Denied: No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // 🧠 { id, email, role, company_id }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

// 👤 Get current authenticated user
exports.getMe = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Not authorized." });

    const [rows] = await db.execute(
      "SELECT id, name, email, role, company_id FROM users WHERE id = ?",
      [req.user.id]
    );

    if (!rows.length) return res.status(404).json({ message: "User not found." });

    const user = rows[0];
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      company_id: user.company_id,
    });
  } catch (err) {
    console.error("❌ getMe error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

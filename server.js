const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

dotenv.config();

const app = express();

// ✅ Security Middleware
app.use(helmet()); // Protects against HTTP security risks

// ✅ Rate Limiting (Prevents Abuse)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: "❌ Too many requests from this IP, please try again later.",
});
app.use('/api/', limiter); // Apply rate limiter to API routes

// ✅ Enable CORS with Credentials Support
const allowedOrigins = ['http://localhost:3000']; // 🔥 Add frontend URLs
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn("🚨 CORS blocked request from:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

app.use(express.json()); // ✅ Parse JSON body
app.use(cookieParser()); // ✅ Parse JWT token from cookies
app.use(morgan('dev')); // ✅ Logs HTTP requests


// ✅ Serve Uploaded Images with Proper CORS Headers
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  setHeaders: (res, filePath) => {
    res.setHeader("Access-Control-Allow-Origin", "*");  // 🔥 Fix CORS issue for images
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin"); // 🔥 Allow frontend access
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
    };
    res.setHeader("Content-Type", contentTypes[ext] || "application/octet-stream");
  }
}));

// ✅ Debugging: Log Incoming Requests
// ✅ Debugging: Log Incoming Requests
app.use((req, res, next) => {
  console.log(`📩 Incoming Request: ${req.method} ${req.path}`);
  console.log(`🔹 Body:`, JSON.stringify(req.body, null, 2));  // Format for readability
  console.log(`🔹 Headers:`, req.headers);
  next();
});


// ✅ Import Routes
const authRoutes = require('./src/routes/authRoutes'); 
const productRoutes = require('./src/routes/productRoutes'); 
const installmentRoutes = require('./src/routes/installmentRoutes'); 
const paymentRoutes = require('./src/routes/paymentRoutes'); 
const adminRoutes = require('./src/routes/adminRoutes'); 
const categoryRoutes = require("./src/routes/categoryRoutes");
const mlRoutes = require("./src/routes/mlRoutes");
const riskRoutes = require('./src/routes/riskRoutes');
const recommendationRoutes = require("./src/routes/recommendationRoutes");



// ✅ Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/installments', installmentRoutes); // ✅ Ensure this is properly registered
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes); 
app.use("/api/categories", categoryRoutes);
app.use("/api/ml", mlRoutes);
app.use('/api/risk', riskRoutes);
app.use("/api/recommend", recommendationRoutes);

// ✅ Debugging: Log Registered Routes
console.log("\n📌 Registered API Routes:");
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    console.log(`✅ ${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
  }
});
app.get("/", (req, res) => {
  res.status(200).json({ message: "🚀 Backend API is alive" });
});

// ✅ Ensure Undefined Routes Return 404 AFTER All Routes Are Defined
app.use((req, res) => {
  console.warn(`❌ 404 - Route Not Found: ${req.method} ${req.path}`);
  res.status(404).json({ message: '❌ Route not found' });
});

// ✅ Global Error Handler (Handles Any Unexpected Errors)
app.use((err, req, res, next) => {
    console.error('❌ Global Error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// ✅ Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

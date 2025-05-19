const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'hyvai-db.cj6ae26q6fc4.eu-north-1.rds.amazonaws.com',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASS || 'StrongPass#2025',
  database: process.env.DB_NAME || 'employee_installment_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;


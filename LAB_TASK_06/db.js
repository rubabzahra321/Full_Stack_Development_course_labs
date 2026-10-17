// Database connection settings for the portfolio project.
// Change these values if your local MySQL username/password are different.
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', 
  database: 'rubab_portfolio',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;

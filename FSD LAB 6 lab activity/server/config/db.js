
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "",
    database: "iphone_studio",
    waitForConnections: true,
    connectionLimit: 10
});

async function nextId(table) {
    const allowedTables = ["products", "payments"];

    if (!allowedTables.includes(table)) {
        throw new Error("Invalid table");
    }

     const [rows] = await pool.query(
        `SELECT MAX(id) AS lastId FROM ${table}`
    );

    return (rows[0].lastId || 0) + 1;
}

module.exports = { pool, nextId };

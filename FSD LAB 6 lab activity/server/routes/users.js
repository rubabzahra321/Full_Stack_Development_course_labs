
const express = require("express");
const router = express.Router();
const { pool, nextId } = require("../config/db");

// GET all users
router.get("/", async (req, res) => {
    try {
        const [data] = await pool.query("SELECT * FROM users");

        res.json({
            success: true,
            count: data.length,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ADD a user
router.post("/", async (req, res) => {
    try {
        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: "Name and email are required"
            });
        }

        const id = await nextId("users");

        await pool.query(
            "INSERT INTO users (id, name, email) VALUES (?, ?, ?)",
            [id, name, email]
        );

        res.status(201).json({
            success: true,
            message: "User added successfully",
            data: { id, name, email }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
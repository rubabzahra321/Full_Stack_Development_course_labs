
const express = require("express");
const router = express.Router();
const { pool, nextId } = require("../config/db");

// GET all payments
router.get("/", async (req, res) => {
    try {
        const [data] = await pool.query("SELECT * FROM payments");

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

// SAVE a payment
router.post("/", async (req, res) => {
    try {
        const {
            userName,
            amount,
            paymentMethod,
            paymentType
        } = req.body;

        if (
            !userName ||
            amount === undefined ||
            !paymentMethod ||
            !paymentType
        ) {
            return res.status(400).json({
                success: false,
                message: "All payment fields are required"
            });
        }

        const id = await nextId("payments");

        await pool.query(
            `INSERT INTO payments
            (id, userName, amount, paymentMethod, paymentType, status, paymentDate)
            VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [
                id,
                userName,
                amount,
                paymentMethod,
                paymentType,
                "Demo successful"
            ]
        );

        res.status(201).json({
            success: true,
            message: "Demo payment saved successfully",
            data: {
                id,
                userName,
                amount,
                paymentMethod,
                paymentType,
                status: "Demo successful"
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;

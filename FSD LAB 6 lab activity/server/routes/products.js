
const express = require("express");
const router = express.Router();
const { pool, nextId } = require("../config/db");

// GET all products
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM products");

        const data = rows.map(product => ({
            ...product,
            colors: JSON.parse(product.colors || "[]"),
            storageOptions: JSON.parse(product.storageOptions || "[]")
        }));

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

// GET one product
router.get("/:id", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM products WHERE id = ?",
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const product = rows[0];

        product.colors = JSON.parse(product.colors || "[]");
        product.storageOptions = JSON.parse(
            product.storageOptions || "[]"
        );

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ADD a product
router.post("/", async (req, res) => {
    try {
        const {
            name,
            category,
            basePrice,
            colors = [],
            storageOptions = [],
            description = ""
        } = req.body;

        if (!name || !category || basePrice === undefined) {
            return res.status(400).json({
                success: false,
                message: "Name, category, and basePrice are required"
            });
        }

        const id = await nextId("products");

        await pool.query(
            `INSERT INTO products
            (id, name, category, basePrice, colors, storageOptions, description)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                name,
                category,
                basePrice,
                JSON.stringify(colors),
                JSON.stringify(storageOptions),
                description
            ]
        );

        res.status(201).json({
            success: true,
            message: "Product added successfully",
            data: { id, ...req.body }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// UPDATE PRODUCT: PUT /api/products/:id
router.put("/:id", async (req, res) => {
    try {
        const { name, category, basePrice, colors, storageOptions, description } = req.body;
        const id = req.params.id;

        if (!name || !category || basePrice === undefined ||
            !colors || !storageOptions || !description) {
            return res.status(400).json({
                success: false,
                message: "All product fields are required"
            });
        }

        const [result] = await pool.query(
            `UPDATE products
             SET name = ?, category = ?, basePrice = ?,
                 colors = ?, storageOptions = ?, description = ?
             WHERE id = ?`,
            [
                name,
                category,
                basePrice,
                JSON.stringify(colors),
                JSON.stringify(storageOptions),
                description,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.json({
            success: true,
            message: "Product updated successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update product"
        });
    }
});


// DELETE PRODUCT: DELETE /api/products/:id
router.delete("/:id", async (req, res) => {
    try {
        const id = req.params.id;

        const [result] = await pool.query(
            "DELETE FROM products WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.json({
            success: true,
            message: "Product deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete product"
        });
    }
});

module.exports = router;

// =============================
// FSD Lab 05 - Express Backend
// Question 3: Node.js + Express Backend
// =============================
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

// =============================
// MIDDLEWARE
// =============================

// Built-in JSON parser middleware
app.use(express.json());

// CORS middleware (allows frontend on different port to communicate)
app.use(cors());

// Custom middleware - logs request method, URL and body
app.use(function (req, res, next) {
    console.log("=========================================");
    console.log("[REQUEST] " + new Date().toISOString());
    console.log("  Method: " + req.method);
    console.log("  URL:    " + req.url);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log("  Body:   " + JSON.stringify(req.body));
    }
    console.log("=========================================");
    next();
});

// =============================
// PREDEFINED PRODUCT DATA (JSON)
// =============================
const products = [
    {
        id: 1,
        name: "iPhone 17 Pro",
        category: "Smartphone",
        basePrice: 799,
        colors: ["Black", "White", "Blue", "Gold", "Rose"],
        storageOptions: ["128 GB", "256 GB", "512 GB"],
        description: "The ultimate iPhone with pro camera system and A19 chip."
    },
    {
        id: 2,
        name: "iPhone 17",
        category: "Smartphone",
        basePrice: 699,
        colors: ["Black", "White", "Blue", "Pink"],
        storageOptions: ["128 GB", "256 GB"],
        description: "The latest iPhone with amazing features at great value."
    },
    {
        id: 3,
        name: "iPhone 17 Pro Max",
        category: "Smartphone",
        basePrice: 1099,
        colors: ["Black", "White", "Blue", "Gold"],
        storageOptions: ["256 GB", "512 GB", "1 TB"],
        description: "The biggest and most powerful iPhone ever created."
    }
];

// In-memory store for submitted configurations
const configurations = [];

// =============================
// GET ROUTES
// =============================

// GET - Welcome / API info
app.get("/", function (req, res) {
    res.json({
        message: "iPhone Studio Backend API - FSD Lab 05",
        endpoints: {
            "GET /api/products": "Get all products",
            "GET /api/products/:id": "Get product by ID",
            "POST /api/configure": "Submit a configuration",
            "GET /api/configurations": "View all saved configurations"
        }
    });
});

// GET - All products
app.get("/api/products", function (req, res) {
    console.log("  -> Sending all products to client");
    res.json({
        success: true,
        count: products.length,
        data: products
    });
});

// GET - Product by ID
app.get("/api/products/:id", function (req, res) {
    const id = parseInt(req.params.id);
    const product = products.find(function (p) { return p.id === id; });

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found with id: " + id
        });
    }

    res.json({
        success: true,
        data: product
    });
});

// GET - All saved configurations (for demo)
app.get("/api/configurations", function (req, res) {
    res.json({
        success: true,
        count: configurations.length,
        data: configurations
    });
});

// =============================
// POST ROUTE
// =============================

// POST - Submit configuration
app.post("/api/configure", function (req, res) {
    console.log("  -> Received configuration from client");
    
    const { productName, color, storage, engraving, premium, effects, price } = req.body;

    // Validation
    if (!productName || !color || !storage) {
        console.log("  -> ERROR: Missing required fields");
        return res.status(400).json({
            success: false,
            message: "Missing required fields: productName, color, storage"
        });
    }

    const config = {
        id: configurations.length + 1,
        productName: productName,
        color: color,
        storage: storage,
        engraving: engraving || "",
        premium: premium || false,
        effects: effects || [],
        price: price || 0,
        submittedAt: new Date().toISOString()
    };

    configurations.push(config);
    console.log("  -> Configuration saved with ID: " + config.id);

    res.status(201).json({
        success: true,
        message: "Configuration submitted successfully",
        data: config
    });
});

// =============================
// START SERVER
// =============================
app.listen(PORT, function () {
    console.log("");
    console.log("=========================================");
    console.log("  iPhone Studio Backend Server");
    console.log("  Running on http://localhost:" + PORT);
    console.log("=========================================");
    console.log("");
});
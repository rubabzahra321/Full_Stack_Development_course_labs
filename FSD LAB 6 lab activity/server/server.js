
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use("/api/products", require("./routes/products"));
app.use("/api/payments", require("./routes/payments"));

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "iPhone Studio Backend is running"
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

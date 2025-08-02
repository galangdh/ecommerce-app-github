 require("dotenv").config();
const express = require("express");
const app = express();
const transactionRoutes = require("./routes/transactionRoutes");
const productRoutes = require("./routes/productRoutes");
app.use(express.json()); // Middleware untuk parsing JSON body

// Rute untuk setiap modul
app.use("/api/transactions", transactionRoutes);
app.use('/api/products', productRoutes);
// Rute dasar
app.get("/", (req, res) => {
  res.send("Welcome to the E-commerce API!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access API at http://localhost:${PORT}/api`);
});

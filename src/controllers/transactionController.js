const TransactionModel = require("../models/transactionModel");
const ProductModel = require("../models/productModel"); // Untuk mendapatkan harga & stok produk
const CustomerModel = require("../models/customerModel"); // Untuk validasi customer

const TransactionController = {
  createTransaction: async (req, res) => {
    const { customerId, items } = req.body; // items: [{ productId, quantity }]

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: "Customer ID and transaction items are required" });
    }

    try {
      // Validasi customer
      const customer = await CustomerModel.findById(customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      let totalAmount = 0;
      const processedItems = [];

      // 1. Validasi Produk & Hitung Total Amount
      for (const item of items) {
        console.log("Looking for product ID:", item.productId);
        const product = await ProductModel.findById(item.productId);
        console.log("Product found:", product);

        if (!product) {
          return res
            .status(404)
            .json({ message: `Product with ID ${item.productId} not found` });
        }

        if (
          !product.id ||
          product.price === undefined ||
          product.stock === undefined
        ) {
          console.error("Product missing required fields:", product);
          return res
            .status(500)
            .json({ message: "Product data is incomplete" });
        }

        if (product.stock < item.quantity) {
          return res.status(400).json({
            message: `Not enough stock for product ${product.name}. Available: ${product.stock}`,
          });
        }

        totalAmount += product.price * item.quantity;
        processedItems.push({
          productId: product.id,
          quantity: item.quantity,
          pricePerItem: product.price,
          stock: product.stock,
        });
      }

      // 2. Buat Transaksi
      const transactionId = await TransactionModel.createTransaction(
        customerId,
        totalAmount,
        "pending"
      );

      // 3. Tambahkan Item Transaksi & Update Stok Produk
      for (const item of processedItems) {
        await TransactionModel.addTransactionItem(
          transactionId,
          item.productId,
          item.quantity,
          item.pricePerItem
        );
        await ProductModel.updateStock(
          item.productId,
          item.stock - item.quantity
        );
      }

      res
        .status(201)
        .json({ message: "Transaction created successfully", transactionId });
    } catch (error) {
      console.error("Error creating transaction:", error);
      res.status(500).json({ message: "Error creating transaction" });
    }
  },

  getTransactionById: async (req, res) => {
    const { id } = req.params;

    try {
      const transactionItems = await TransactionModel.findById(id);
      if (transactionItems.length === 0) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      const transaction = {
        id: transactionItems[0].id,
        customer_id: transactionItems[0].customer_id,
        total_amount: transactionItems[0].total_amount,
        status: transactionItems[0].status,
        transaction_date: transactionItems[0].transaction_date,
        items: transactionItems.map((item) => ({
          item_id: item.item_id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price_per_item: item.price_per_item,
        })),
      };

      res.status(200).json(transaction);
    } catch (error) {
      console.error("Error getting transaction by ID:", error);
      res.status(500).json({ message: "Error getting transaction" });
    }
  },

  getTransactionsByCustomerId: async (req, res) => {
    const { customerId } = req.params;

    try {
      const transactionItems = await TransactionModel.findByCustomerId(
        customerId
      );
      if (transactionItems.length === 0) {
        return res
          .status(404)
          .json({ message: "No transactions found for this customer" });
      }

      const transactionsMap = new Map();
      transactionItems.forEach((item) => {
        if (!transactionsMap.has(item.id)) {
          transactionsMap.set(item.id, {
            id: item.id,
            customer_id: item.customer_id,
            total_amount: item.total_amount,
            status: item.status,
            transaction_date: item.transaction_date,
            items: [],
          });
        }
        transactionsMap.get(item.id).items.push({
          item_id: item.item_id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price_per_item: item.price_per_item,
        });
      });

      res.status(200).json(Array.from(transactionsMap.values()));
    } catch (error) {
      console.error("Error getting transactions by customer ID:", error);
      res.status(500).json({ message: "Error getting transactions" });
    }
  },

  updateTransactionStatus: async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["pending", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status provided" });
    }

    try {
      const affectedRows = await TransactionModel.updateStatus(id, status);
      if (affectedRows === 0) {
        return res
          .status(404)
          .json({ message: "Transaction not found or no changes made" });
      }

      res
        .status(200)
        .json({ message: "Transaction status updated successfully" });
    } catch (error) {
      console.error("Error updating transaction status:", error);
      res.status(500).json({ message: "Error updating transaction status" });
    }
  },

  deleteTransaction: async (req, res) => {
    const { id } = req.params;

    try {
      const affectedRows = await TransactionModel.delete(id);
      if (affectedRows === 0) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      res.status(200).json({ message: "Transaction deleted successfully" });
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res.status(500).json({ message: "Error deleting transaction" });
    }
  },

  getAllTransactions: async (req, res) => {
    try {
      const transactionItems = await TransactionModel.getAll();
      if (transactionItems.length === 0) {
        return res.status(200).json([]); // No transactions found
      }

      const transactionsMap = new Map();
      transactionItems.forEach((item) => {
        if (!transactionsMap.has(item.id)) {
          transactionsMap.set(item.id, {
            id: item.id,
            customer_id: item.customer_id,
            total_amount: item.total_amount,
            status: item.status,
            transaction_date: item.transaction_date,
            items: [],
          });
        }
        transactionsMap.get(item.id).items.push({
          item_id: item.item_id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price_per_item: item.price_per_item,
        });
      });

      res.status(200).json(Array.from(transactionsMap.values()));
    } catch (error) {
      console.error("Error getting all transactions:", error);
      res.status(500).json({ message: "Error getting all transactions" });
    }
  },
};

module.exports = TransactionController;

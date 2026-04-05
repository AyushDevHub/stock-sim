import express from "express";
import Stock from "../models/Stock.js";
import {
  getLiveStockData,
  getLiveBatchStockData,
  searchStock,
} from "../services/stockService.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

// GET /stocks - list all symbols in registry with live prices
router.get("/", protect, async (req, res) => {
  try {
    const stocks = await Stock.find().select("-__v");
    const symbols = stocks.map((s) => s.symbol);

    const liveData = await getLiveBatchStockData(symbols);

    const merged = stocks.map((s) => {
      const live = liveData.find((l) => l.symbol === s.symbol) || {};
      return {
        symbol: s.symbol,
        name: s.name,
        exchange: s.exchange,
        price: live.price ?? null,
        change: live.change ?? null,
        percentChange: live.percentChange ?? null,
      };
    });

    res.json({ stocks: merged });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /stocks/quote/:symbol - get live quote for one stock
router.get("/quote/:symbol", protect, async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const data = await getLiveStockData(symbol);
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
});

// GET /stocks/search?q=query - search by company name
router.get("/search", protect, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q)
      return res
        .status(400)
        .json({ message: "Query parameter 'q' is required" });
    const results = await searchStock(q);
    res.json({ results });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
});

export default router;

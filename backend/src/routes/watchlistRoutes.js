import express from "express";
import Watchlist from "../models/Watchlist.js";
import { getAllPrices, getPrice } from "../services/pricePollerService.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

// ✅ GET /watchlist
router.get("/", protect, async (req, res) => {
  try {
    const items = await Watchlist.find({ userId: req.user._id })
      .sort({ addedAt: -1 })
      .select("symbol -_id");

    const symbols = items
      .map((i) => i.symbol)
      .filter((s) => typeof s === "string" && s.trim().length > 0);

    // 🔥 GET ALL PRICES (FAST)
    const prices = getAllPrices();

    const watchlistWithPrices = items.map((i) => ({
      symbol: i.symbol,
      price: prices[i.symbol]?.price || null,
      change: prices[i.symbol]?.change || 0,
    }));

    res.json({
      message: "...",
      watchlist: watchlistWithPrices,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});


// ✅ POST /watchlist
router.post("/", protect, async (req, res) => {
  try {
    let { symbol } = req.body;

    // 🔥 VALIDATION
    if (!symbol || typeof symbol !== "string") {
      return res.status(400).json({ message: "Invalid symbol" });
    }

    symbol = symbol.trim().toUpperCase();

    if (!symbol) {
      return res.status(400).json({ message: "Invalid symbol" });
    }

    // 🔥 UPSERT (NO DUPLICATE)
    await Watchlist.updateOne(
      { userId: req.user._id, symbol },
      {
        $setOnInsert: {
          userId: req.user._id,
          symbol,
          addedAt: new Date(),
        },
      },
      { upsert: true }
    );

    const items = await Watchlist.find({ userId: req.user._id })
      .sort({ addedAt: -1 })
      .select("symbol -_id");

    res.status(201).json({
      message: `${symbol} added`,
      watchlist: items.map((i) => i.symbol),
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ✅ DELETE /watchlist/:symbol
router.delete("/:symbol", protect, async (req, res) => {
  try {
    let symbol = req.params.symbol;

    symbol = symbol?.trim().toUpperCase();

    if (!symbol) {
      return res.status(400).json({ message: "Invalid symbol" });
    }

    await Watchlist.deleteOne({ userId: req.user._id, symbol });

    const items = await Watchlist.find({ userId: req.user._id })
      .sort({ addedAt: -1 })
      .select("symbol -_id");

    res.json({
      message: `${symbol} removed`,
      watchlist: items.map((i) => i.symbol),
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;

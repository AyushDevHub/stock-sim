import express from "express";
import Stock from "../models/Stock.js";
import { getLiveStockData, searchStock } from "../services/stockService.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", protect, async (req, res) => {
  try {
    const stocks = await Stock.find().select("-__v");
    res.json({ stocks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUBLIC — no auth, needed by landing page
router.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ message: "q required" });
  try {
    const dbMatches = await Stock.find({
      $or: [
        { symbol: { $regex: q.toUpperCase(), $options: "i" } },
        { name: { $regex: q, $options: "i" } },
      ],
    }).limit(6);
    const dbFmt = dbMatches.map((s) => ({
      symbol: s.symbol,
      shortname: s.name,
      longname: s.name,
      exchDisp: s.exchange,
    }));
    let yahoo = [];
    try {
      yahoo = await searchStock(q);
    } catch {}
    const seen = new Set(dbFmt.map((r) => r.symbol));
    res.json({
      results: [...dbFmt, ...yahoo.filter((r) => !seen.has(r.symbol))].slice(
        0,
        10
      ),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Dynamically register any Yahoo Finance symbol into the DB
router.post("/add", protect, async (req, res) => {
  const symbol = req.body.symbol?.toUpperCase();
  if (!symbol) return res.status(400).json({ message: "symbol required" });
  try {
    const existing = await Stock.findOne({ symbol });
    if (existing) return res.json({ stock: existing, added: false });
    const live = await getLiveStockData(symbol);
    if (!live) return res.status(404).json({ message: `${symbol} not found` });
    const stock = await Stock.create({
      symbol,
      name: live.name || symbol,
      exchange: live.exchange || "NSE",
    });
    res.status(201).json({ stock, added: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/quote/:symbol", protect, async (req, res) => {
  try {
    const data = await getLiveStockData(req.params.symbol.toUpperCase());
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

export default router;

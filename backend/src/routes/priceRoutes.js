import express from "express";
import jwt from "jsonwebtoken";
import { getAllPrices, getPrice } from "../services/pricePollerService.js";

const router = express.Router();

// ── REST: snapshot of all prices ──────────────────────────────────────────
// GET /prices
// Returns current cached prices for all symbols.
// Frontend can call this every 5-10s for simple polling.
router.get("/", (req, res) => {
  const prices = getAllPrices();

  if (!prices.length)
    return res
      .status(503)
      .json({ message: "Price cache warming up, try again in a few seconds" });

  res.json({
    count: prices.length,
    updatedAt: Date.now(),
    prices,
  });
});

// ── REST: single symbol price ─────────────────────────────────────────────
// GET /prices/:symbol
router.get("/:symbol", (req, res) => {
  const price = getPrice(req.params.symbol);

  if (!price)
    return res
      .status(404)
      .json({
        message: `No price data for ${req.params.symbol.toUpperCase()}`,
      });

  res.json(price);
});

// ── SSE: real-time price stream ───────────────────────────────────────────
// GET /prices/stream
// Pushes price updates every 10s over Server-Sent Events.
// No polling needed on frontend — browser keeps connection open.
//
// Auth via ?token=... query param (SSE can't send headers)
router.get("/stream/live", (req, res) => {
  // validate JWT from query param
  try {
    const token = req.query.token;
    if (!token)
      return res.status(401).json({ message: "Token required as ?token=..." });
    jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering
  res.flushHeaders();

  // send immediately
  const send = () => {
    const prices = getAllPrices();
    if (prices.length) {
      res.write(
        `data: ${JSON.stringify({ prices, updatedAt: Date.now() })}\n\n`
      );
    }
  };

  send();
  const timer = setInterval(send, 10000);

  // cleanup when client disconnects
  req.on("close", () => {
    clearInterval(timer);
    console.log("[SSE] Client disconnected");
  });
});

export default router;

import express from "express";
import jwt from "jsonwebtoken";
import { getAllPrices, getPrice } from "../services/pricePollerService.js";

const router = express.Router();

// Public — no auth needed (used by landing page)
router.get("/", (req, res) => {
  const prices = getAllPrices();
  if (!prices.length)
    return res
      .status(503)
      .json({ message: "Price cache warming up, try again shortly" });
  res.json({ count: prices.length, updatedAt: Date.now(), prices });
});

// Public single symbol
router.get("/:symbol", (req, res) => {
  const price = getPrice(req.params.symbol);
  if (!price)
    return res.status(404).json({
      message: `No price data for ${req.params.symbol.toUpperCase()}`,
    });
  res.json(price);
});

// SSE stream — auth via ?token= query param
router.get("/stream/live", (req, res) => {
  try {
    const token = req.query.token;
    if (!token)
      return res.status(401).json({ message: "Token required as ?token=..." });
    jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = () => {
    const prices = getAllPrices();
    if (prices.length)
      res.write(
        `data: ${JSON.stringify({ prices, updatedAt: Date.now() })}\n\n`
      );
  };

  send();
  const timer = setInterval(send, 1000);
  req.on("close", () => {
    clearInterval(timer);
  });
});

export default router;

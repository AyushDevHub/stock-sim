import express from "express";
import jwt from "jsonwebtoken";
import {
  getAllPrices,
  getPrice,
  getRateLimitState,
} from "../services/pricePollerService.js";

const router = express.Router();

/**
 * GET /api/prices
 * Returns the full in-memory price cache.
 * Also returns current rate-limit state so clients can show the banner
 * even if they connect via HTTP before the socket handshake completes.
 * Public — no auth required (used by landing page + initial hydration).
 */
router.get("/", (req, res) => {
  const prices = getAllPrices();
  const rateLimit = getRateLimitState();

  // Always return what we have — even if stale — so UI never blanks.
  // 503 only if cache is completely empty (server just booted).
  if (!prices.length && !rateLimit.limited) {
    return res
      .status(503)
      .json({ message: "Price cache warming up, try again shortly" });
  }

  res.json({
    count: prices.length,
    updatedAt: Date.now(),
    prices,
    rateLimit, // { limited: bool, retryAt?: number, retryAfterMs?: number }
  });
});

/**
 * GET /api/prices/status
 * Lightweight endpoint — just returns rate-limit state + cache freshness.
 * Frontend can poll this on reconnect instead of fetching all prices.
 */
router.get("/status", (req, res) => {
  const prices = getAllPrices();
  const rateLimit = getRateLimitState();
  const lastPrice = prices[0];

  res.json({
    cacheSize: prices.length,
    lastUpdated: lastPrice?.updatedAt || null,
    rateLimit,
  });
});

/**
 * GET /api/prices/:symbol
 * Single symbol lookup from cache.
 */
router.get("/:symbol", (req, res) => {
  const price = getPrice(req.params.symbol);
  if (!price) {
    return res.status(404).json({
      message: `No price data for ${req.params.symbol.toUpperCase()}`,
    });
  }
  res.json(price);
});

/**
 * GET /api/prices/stream/live  (SSE)
 * Auth via ?token= query param.
 * Streams the cache every second — useful for pages that can't use Socket.io.
 */
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
    const rateLimit = getRateLimitState();
    if (prices.length) {
      res.write(
        `data: ${JSON.stringify({
          prices,
          rateLimit,
          updatedAt: Date.now(),
        })}\n\n`
      );
    }
  };

  send();
  const timer = setInterval(send, 1000);
  req.on("close", () => clearInterval(timer));
});

export default router;

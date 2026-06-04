import YahooFinance from "yahoo-finance2";
import Stock from "../models/Stock.js";
import { emitPrices, emitRateLimit, clearRateLimit } from "./socketService.js";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const toTicker = (s) =>
  s.includes(".") ? s.toUpperCase() : `${s.toUpperCase()}.NS`;

// ─── In-memory price cache ────────────────────────────────────────────────────
// Single source of truth for all users. Never wiped on rate-limit — stale
// prices stay visible in the UI until fresh ones arrive.
const priceCache = new Map();

let isPolling = false;
let pollInterval = null;

// ─── Rate-limit backoff state ─────────────────────────────────────────────────
let backoffUntil = 0;
let backoffMs = 0;
const BASE_BACKOFF_MS = 3 * 60_000; // 3 min — Yahoo needs more than 60s
const MAX_BACKOFF_MS = 30 * 60_000; // 30 min hard cap
const JITTER_MS = 15_000; // +0–15 s random so retries don't slam in sync

// ─── Helpers ──────────────────────────────────────────────────────────────────
const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const calcBackoffMs = (err) => {
  const retryAfterSec =
    err?.response?.headers?.["retry-after"] ||
    err?.headers?.["retry-after"] ||
    null;

  const jitter = Math.random() * JITTER_MS;

  if (retryAfterSec) {
    return Math.min(Number(retryAfterSec) * 1000, MAX_BACKOFF_MS) + jitter;
  }

  // Exponential backoff — doubles each consecutive 429, caps at MAX
  backoffMs = backoffMs
    ? Math.min(backoffMs * 2, MAX_BACKOFF_MS)
    : BASE_BACKOFF_MS;
  return backoffMs + jitter;
};

const is429 = (err) =>
  err?.message?.includes("429") ||
  err?.response?.status === 429 ||
  err?.status === 429;

// ─── Core poll ────────────────────────────────────────────────────────────────
const refreshPrices = async () => {
  if (Date.now() < backoffUntil) {
    const remaining = backoffUntil - Date.now();
    console.log(
      `[PricePoller] Rate-limited — skipping tick. Retry in ${Math.ceil(
        remaining / 1000
      )}s`
    );
    return;
  }

  try {
    const stocks = await Stock.find().select("symbol").lean();
    if (!stocks.length) return;

    const tickers = stocks.map(({ symbol }) => toTicker(symbol));
    const symbolByTicker = {};
    stocks.forEach(({ symbol }) => {
      symbolByTicker[toTicker(symbol)] = symbol;
    });

    let updated = 0;
    let rateLimitHit = false;

    for (const batch of chunk(tickers, 20)) {
      if (Date.now() < backoffUntil) {
        console.log(
          "[PricePoller] Rate-limit mid-run — aborting remaining batches"
        );
        break;
      }

      try {
        const results = await yahooFinance.quote(
          batch,
          {},
          { validateResult: false }
        );
        const quotes = Array.isArray(results) ? results : [results];

        for (const q of quotes) {
          if (!q?.symbol || !q?.regularMarketPrice) continue;

          const symbol =
            symbolByTicker[q.symbol] || q.symbol.replace(".NS", "");
          const prev = priceCache.get(symbol);
          const price = q.regularMarketPrice;

          priceCache.set(symbol, {
            symbol,
            name: q.longName || q.shortName || symbol,
            price,
            open: q.regularMarketOpen,
            high: q.regularMarketDayHigh,
            low: q.regularMarketDayLow,
            previousClose: q.regularMarketPreviousClose,
            change: +(q.regularMarketChange || 0).toFixed(2),
            percentChange: +(q.regularMarketChangePercent || 0).toFixed(2),
            volume: q.regularMarketVolume,
            marketState: q.marketState,
            direction: prev
              ? price > prev.price
                ? "up"
                : price < prev.price
                ? "down"
                : "flat"
              : "flat",
            updatedAt: Date.now(),
          });

          updated++;
        }
      } catch (batchErr) {
        if (is429(batchErr)) {
          const waitMs = calcBackoffMs(batchErr);
          backoffUntil = Date.now() + waitMs;
          rateLimitHit = true;

          console.warn(
            `[PricePoller] 429 hit. Backing off ${Math.round(
              waitMs / 1000
            )}s ` + `— retry at ${new Date(backoffUntil).toLocaleTimeString()}`
          );

          emitRateLimit({ retryAfterMs: waitMs, retryAt: backoffUntil });
          break;
        } else {
          console.warn(`[PricePoller] Batch error: ${batchErr.message}`);
        }
      }

      await sleep(500); // polite inter-batch delay
    }

    // ── Only reset backoff after a FULLY successful cycle ──────────────────
    if (!rateLimitHit) {
      backoffMs = 0;
      console.log(
        `[PricePoller] ✓ Updated ${updated}/${stocks.length} prices ` +
          `at ${new Date().toLocaleTimeString()}`
      );
    }

    // ── Push to all clients if anything was updated ────────────────────────
    // We always push from cache — even partial updates — so UI never blanks.
    if (updated > 0) {
      clearRateLimit(); // prices are flowing → hide the banner
      emitPrices(getAllPrices()); // broadcast to all connected sockets
    }
  } catch (err) {
    // DB or other hard failure — log but don't crash the poller
    console.error("[PricePoller] Unexpected error:", err.message);
  }
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Start the shared price poller.
 * Called ONCE on server boot — all users receive updates via Socket.io.
 * No user interaction triggers a Yahoo request.
 */
export const startPricePoller = async (intervalMs = 60_000) => {
  if (isPolling) return;
  isPolling = true;

  console.log(
    `[PricePoller] Starting — polling Yahoo every ${
      intervalMs / 1000
    }s, pushing via Socket.io`
  );

  await refreshPrices(); // warm cache immediately on boot
  pollInterval = setInterval(refreshPrices, intervalMs);
};

export const stopPricePoller = () => {
  if (pollInterval) clearInterval(pollInterval);
  isPolling = false;
  console.log("[PricePoller] Stopped");
};

/** Full cache — used by REST /api/prices (HTTP fallback for new connections) */
export const getAllPrices = () => Array.from(priceCache.values());
export const getPrice = (symbol) =>
  priceCache.get(symbol.toUpperCase()) || null;
export const getCacheSize = () => priceCache.size;

/** Current backoff state — exposed so REST can return it too */
export const getRateLimitState = () =>
  backoffUntil > Date.now()
    ? {
        limited: true,
        retryAt: backoffUntil,
        retryAfterMs: backoffUntil - Date.now(),
      }
    : { limited: false };

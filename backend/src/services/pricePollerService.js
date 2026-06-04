import YahooFinance from "yahoo-finance2";
import Stock from "../models/Stock.js";
import { emitPrices, emitRateLimit } from "./socketService.js";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const toTicker = (s) =>
  s.includes(".") ? s.toUpperCase() : `${s.toUpperCase()}.NS`;

// In-memory price cache
const priceCache = new Map();

let isPolling = false;
let pollInterval = null;

// Rate-limit backoff state
let backoffUntil = 0; // timestamp when we're allowed to poll again
let backoffMs = 0; // current backoff duration
const BASE_BACKOFF_MS = 60_000; // 1 minute base
const MAX_BACKOFF_MS = 30 * 60_000; // 30 minutes max

// Split array into chunks
const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

// Sleep helper
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Parse Retry-After header or pick exponential backoff.
 * Yahoo returns 429 with optional Retry-After (seconds).
 */
const calcBackoffMs = (err) => {
  // Try to read Retry-After from the error (yahoo-finance2 may attach it)
  const retryAfterSec =
    err?.response?.headers?.["retry-after"] ||
    err?.headers?.["retry-after"] ||
    null;

  if (retryAfterSec) {
    return Math.min(Number(retryAfterSec) * 1000, MAX_BACKOFF_MS);
  }

  // Exponential backoff: double each time, cap at MAX
  backoffMs = backoffMs
    ? Math.min(backoffMs * 2, MAX_BACKOFF_MS)
    : BASE_BACKOFF_MS;
  return backoffMs;
};

const is429 = (err) =>
  err?.message?.includes("429") ||
  err?.response?.status === 429 ||
  err?.status === 429;

const refreshPrices = async () => {
  // Still in backoff window — skip this tick
  if (Date.now() < backoffUntil) {
    const remainingMs = backoffUntil - Date.now();
    console.log(
      `[PricePoller] Rate-limited — skipping tick. Retry in ${Math.ceil(
        remainingMs / 1000
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

    const batches = chunk(tickers, 20);

    for (const batch of batches) {
      // Re-check backoff between batches
      if (Date.now() < backoffUntil) {
        console.log(
          `[PricePoller] Rate-limit triggered mid-run — aborting remaining batches`
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

        // Reset backoff on a successful batch
        backoffMs = 0;
      } catch (batchErr) {
        if (is429(batchErr)) {
          const waitMs = calcBackoffMs(batchErr);
          backoffUntil = Date.now() + waitMs;
          rateLimitHit = true;

          const retryAt = new Date(backoffUntil);
          console.warn(
            `[PricePoller] 429 Rate-limited. Backing off for ${Math.round(
              waitMs / 1000
            )}s — retry at ${retryAt.toLocaleTimeString()}`
          );

          // Notify all connected clients
          emitRateLimit({
            retryAfterMs: waitMs,
            retryAt: backoffUntil,
          });

          break; // stop processing remaining batches
        } else {
          console.warn(`[PricePoller] Batch failed: ${batchErr.message}`);
        }
      }

      // Polite delay between batches
      await sleep(500);
    }

    if (!rateLimitHit) {
      console.log(
        `[PricePoller] Updated ${updated}/${
          stocks.length
        } prices at ${new Date().toLocaleTimeString()}`
      );
    }

    if (updated > 0) {
      emitPrices(getAllPrices());
    }
  } catch (err) {
    console.error("[PricePoller] Error refreshing prices:", err.message);
  }
};

export const startPricePoller = async (intervalMs = 30_000) => {
  if (isPolling) return;
  isPolling = true;

  console.log(
    `[PricePoller] Starting — pushing via Socket.io every ${intervalMs / 1000}s`
  );

  await refreshPrices(); // warm cache on startup

  pollInterval = setInterval(refreshPrices, intervalMs);
};

export const stopPricePoller = () => {
  if (pollInterval) clearInterval(pollInterval);
  isPolling = false;
  console.log("[PricePoller] Stopped");
};

export const getAllPrices = () => Array.from(priceCache.values());
export const getPrice = (symbol) =>
  priceCache.get(symbol.toUpperCase()) || null;
export const getCacheSize = () => priceCache.size;

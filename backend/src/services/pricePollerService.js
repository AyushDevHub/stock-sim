import YahooFinance from "yahoo-finance2";
import Stock from "../models/Stock.js";
import { emitPrices, emitRateLimit, clearRateLimit } from "./socketService.js";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const toTicker = (s) =>
  s.includes(".") ? s.toUpperCase() : `${s.toUpperCase()}.NS`;

// In-memory price cache
const priceCache = new Map();

let isPolling = false;
let pollInterval = null;

// Rate-limit backoff state
let backoffUntil = 0;
let backoffMs = 0;
const BASE_BACKOFF_MS = 60_000;
const MAX_BACKOFF_MS = 30 * 60_000;
const JITTER_MS = 10_000; // up to 10s random jitter so we don't slam Yahoo the instant backoff expires

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

  backoffMs = backoffMs
    ? Math.min(backoffMs * 2, MAX_BACKOFF_MS)
    : BASE_BACKOFF_MS;
  return backoffMs + jitter;
};

const is429 = (err) =>
  err?.message?.includes("429") ||
  err?.response?.status === 429 ||
  err?.status === 429;

const refreshPrices = async () => {
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

          emitRateLimit({
            retryAfterMs: waitMs,
            retryAt: backoffUntil,
          });

          break;
        } else {
          console.warn(`[PricePoller] Batch failed: ${batchErr.message}`);
        }
      }

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
      // Clear rate limit state — prices are flowing again
      clearRateLimit();
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

  await refreshPrices();

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

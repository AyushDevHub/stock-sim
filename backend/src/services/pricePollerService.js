import YahooFinance from "yahoo-finance2";
import Stock from "../models/Stock.js";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const toTicker = (s) =>
  s.includes(".") ? s.toUpperCase() : `${s.toUpperCase()}.NS`;

// In-memory price cache: { TCS: { price, change, ... }, INFY: { ... } }
const priceCache = new Map();

let isPolling = false;
let pollInterval = null;

// ── fetch all registered symbols and update cache ──────────────────────────
const refreshPrices = async () => {
  try {
    const stocks = await Stock.find().select("symbol").lean();
    if (!stocks.length) return;

    const results = await Promise.allSettled(
      stocks.map(({ symbol }) =>
        yahooFinance.quote(toTicker(symbol)).then((q) => ({ symbol, q }))
      )
    );

    let updated = 0;

    for (const r of results) {
      if (r.status !== "fulfilled") continue;
      const { symbol, q } = r.value;
      if (!q?.regularMarketPrice) continue;

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
        // direction flag for frontend flash animation
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

    console.log(
      `[PricePoller] Updated ${updated}/${
        stocks.length
      } prices at ${new Date().toLocaleTimeString()}`
    );
  } catch (err) {
    console.error("[PricePoller] Error refreshing prices:", err.message);
  }
};

// ── start / stop ───────────────────────────────────────────────────────────
export const startPricePoller = async (intervalMs = 10000) => {
  if (isPolling) return;
  isPolling = true;

  console.log(`[PricePoller] Starting — polling every ${intervalMs / 1000}s`);

  // first fetch immediately so cache isn't empty on first request
  await refreshPrices();

  pollInterval = setInterval(refreshPrices, intervalMs);
};

export const stopPricePoller = () => {
  if (pollInterval) clearInterval(pollInterval);
  isPolling = false;
  console.log("[PricePoller] Stopped");
};

// ── cache accessors ────────────────────────────────────────────────────────
export const getAllPrices = () => Array.from(priceCache.values());
export const getPrice = (symbol) =>
  priceCache.get(symbol.toUpperCase()) || null;
export const getCacheSize = () => priceCache.size;

import YahooFinance from "yahoo-finance2";
import Stock from "../models/Stock.js";
import { emitPrices } from "./socketService.js";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const toTicker = (s) =>
  s.includes(".") ? s.toUpperCase() : `${s.toUpperCase()}.NS`;

// In-memory price cache
const priceCache = new Map();

let isPolling = false;
let pollInterval = null;

// Split array into chunks
const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

// Sleep helper for rate-limit spacing
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const refreshPrices = async () => {
  try {
    const stocks = await Stock.find().select("symbol").lean();
    if (!stocks.length) return;

    const tickers = stocks.map(({ symbol }) => toTicker(symbol));
    const symbolByTicker = {};
    stocks.forEach(({ symbol }) => {
      symbolByTicker[toTicker(symbol)] = symbol;
    });

    let updated = 0;

    // Batch into groups of 20 — one HTTP call per batch instead of 102
    const batches = chunk(tickers, 20);

    for (const batch of batches) {
      try {
        // yahoo-finance2 accepts an array of symbols in a single call
        const results = await yahooFinance.quote(
          batch,
          {},
          { validateResult: false }
        );

        // quote() returns array when given array, single obj when given string
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
        console.warn(`[PricePoller] Batch failed: ${batchErr.message}`);
      }

      // Small delay between batches to avoid hammering Yahoo
      await sleep(300);
    }

    console.log(
      `[PricePoller] Updated ${updated}/${
        stocks.length
      } prices at ${new Date().toLocaleTimeString()}`
    );

    if (updated > 0) {
      emitPrices(getAllPrices());
    }
  } catch (err) {
    console.error("[PricePoller] Error refreshing prices:", err.message);
  }
};

export const startPricePoller = async (intervalMs = 10000) => {
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

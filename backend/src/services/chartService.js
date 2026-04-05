import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
});

const toTicker = (symbol) =>
  symbol.includes(".") ? symbol.toUpperCase() : `${symbol.toUpperCase()}.NS`;

// How far back to fetch based on interval
const PERIOD_MAP = {
  "1m": () => daysAgo(1),
  "5m": () => daysAgo(5),
  "15m": () => daysAgo(5),
  "1h": () => daysAgo(30),
  "1d": () => daysAgo(365),
  "1wk": () => daysAgo(365 * 5),
  "1mo": () => new Date("1990-01-01"),
};

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/**
 * Fetch OHLCV chart data formatted for TradingView Lightweight Charts
 * GET /chart/:symbol?interval=1d
 */
export const getChartData = async (symbol, interval = "1d") => {
  const ticker = toTicker(symbol);
  const period1 = PERIOD_MAP[interval]?.() ?? daysAgo(365);
  const period2 = new Date();

  const result = await yahooFinance.chart(ticker, {
    period1,
    period2,
    interval,
  });

  if (!result?.quotes?.length)
    throw Object.assign(new Error(`No chart data for ${symbol}`), {
      status: 404,
    });

  const candles = [];
  const volumes = [];

  for (const q of result.quotes) {
    if (q.open == null || q.high == null || q.low == null || q.close == null)
      continue;

    const time = Math.floor(new Date(q.date).getTime() / 1000);

    candles.push({
      time,
      open: +q.open.toFixed(2),
      high: +q.high.toFixed(2),
      low: +q.low.toFixed(2),
      close: +q.close.toFixed(2),
    });

    volumes.push({
      time,
      value: q.volume || 0,
      color: q.close >= q.open ? "#26a69a" : "#ef5350",
    });
  }

  const meta = result.meta || {};

  return {
    symbol: symbol.toUpperCase(),
    ticker,
    interval,
    currency: meta.currency || "INR",
    exchangeName: meta.exchangeName || "NSE",
    regularMarketPrice: meta.regularMarketPrice,
    previousClose: meta.chartPreviousClose,
    candles,
    volumes,
  };
};

/**
 * Live quote for polling — call every 5s from frontend
 * GET /chart/:symbol/quote
 */
export const getLiveQuote = async (symbol) => {
  const ticker = toTicker(symbol);
  const quote = await yahooFinance.quote(ticker);

  if (!quote?.regularMarketPrice)
    throw Object.assign(new Error(`No quote for ${symbol}`), { status: 404 });

  return {
    symbol: symbol.toUpperCase(),
    price: quote.regularMarketPrice,
    open: quote.regularMarketOpen,
    high: quote.regularMarketDayHigh,
    low: quote.regularMarketDayLow,
    previousClose: quote.regularMarketPreviousClose,
    change: +(quote.regularMarketChange || 0).toFixed(2),
    percentChange: +(quote.regularMarketChangePercent || 0).toFixed(2),
    volume: quote.regularMarketVolume,
    marketCap: quote.marketCap,
    name: quote.longName || quote.shortName,
    currency: quote.currency || "INR",
    marketState: quote.marketState, // "REGULAR" | "PRE" | "POST" | "CLOSED"
    timestamp: Date.now(),
  };
};

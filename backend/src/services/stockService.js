import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
});

const toTicker = (symbol) =>
  symbol.includes(".") ? symbol.toUpperCase() : `${symbol.toUpperCase()}.NS`;

export const getLiveStockData = async (symbol) => {
  const ticker = toTicker(symbol);
  const quote = await yahooFinance.quote(ticker);

  if (!quote?.regularMarketPrice)
    throw Object.assign(new Error(`No data found for ${symbol}`), {
      status: 404,
    });

  return {
    price: quote.regularMarketPrice,
    name: quote.longName || quote.shortName,
    change: quote.regularMarketChange,
    percentChange: quote.regularMarketChangePercent,
  };
};

export const getLiveBatchStockData = async (symbols) => {
  const results = await Promise.all(
    symbols.map((s) => yahooFinance.quote(toTicker(s)).catch(() => null))
  );

  return results.filter(Boolean).map((quote) => ({
    symbol: quote.symbol.replace(".NS", "").replace(".BO", ""),
    price: quote.regularMarketPrice,
    name: quote.longName || quote.shortName,
    change: quote.regularMarketChange,
    percentChange: quote.regularMarketChangePercent,
  }));
};

export const searchStock = async (query) => {
  const results = await yahooFinance.search(query);
  return results.quotes.filter(
    (q) => q.exchange === "NSI" || q.exchange === "BSE"
  );
};

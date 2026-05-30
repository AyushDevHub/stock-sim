import { useState, useEffect, useCallback } from "react";
import api from "../services/api.js";

// Normalize watchlist response — backend sometimes returns:
//   GET  → [{ symbol, price, change }, ...]   (objects)
//   POST/DELETE → ["TCS", "INFY", ...]        (strings)
const toSymbolArray = (arr = []) =>
  arr
    .map((item) => (typeof item === "string" ? item : item.symbol))
    .filter(Boolean);

export const useWatchlist = () => {
  const [symbols, setSymbols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);

  const fetchWatchlist = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/watchlist");
      setSymbols(toSymbolArray(data.watchlist));
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load watchlist");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const add = useCallback(async (symbol) => {
    setAdding(true);
    setError(null);
    try {
      const { data } = await api.post("/watchlist", {
        symbol: symbol.toUpperCase(),
      });
      setSymbols(toSymbolArray(data.watchlist));
      return { ok: true };
    } catch (e) {
      const msg = e.response?.data?.message || "Failed to add";
      setError(msg);
      return { ok: false, msg };
    } finally {
      setAdding(false);
    }
  }, []);

  const remove = useCallback(
    async (symbol) => {
      // Optimistic update
      setSymbols((prev) => prev.filter((s) => s !== symbol));
      try {
        const { data } = await api.delete(`/watchlist/${symbol}`);
        setSymbols(toSymbolArray(data.watchlist));
      } catch {
        fetchWatchlist(); // revert on failure
      }
    },
    [fetchWatchlist]
  );

  const isInWatchlist = useCallback(
    (symbol) => symbols.includes(symbol?.toUpperCase()),
    [symbols]
  );

  return { symbols, loading, adding, error, add, remove, isInWatchlist };
};

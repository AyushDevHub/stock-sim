import { useState, useEffect, useCallback } from "react";
import api from "../services/api.js";

export const useWatchlist = () => {
  const [symbols, setSymbols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      const { data } = await api.get("/watchlist");
      setSymbols(data.watchlist?.map((item) => item.symbol) || []);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load watchlist");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const add = useCallback(async (symbol) => {
    setAdding(true);
    setError(null);
    try {
      const { data } = await api.post("/watchlist", { symbol });
      setSymbols(data.watchlist?.map((item) => item.symbol) || []);
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
      // optimistic update
      setSymbols((prev) => prev.filter((s) => s !== symbol));
      try {
        const { data } = await api.delete(`/watchlist/${symbol}`);
        setSymbols(data.watchlist?.map((item) => item.symbol) || []);
      } catch (e) {
        // revert on fail
        fetch();
      }
    },
    [fetch]
  );

  const isInWatchlist = useCallback(
    (symbol) => symbols.includes(symbol?.toUpperCase()),
    [symbols]
  );

  return { symbols, loading, adding, error, add, remove, isInWatchlist };
};

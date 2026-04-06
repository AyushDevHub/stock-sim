import { useState, useEffect, useRef } from "react";
import api from "../services/api.js";

// Polls /prices every 10s and tracks price direction for flash animation
export const usePrices = () => {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const prevRef = useRef({});

  const fetchPrices = async () => {
    try {
      const { data } = await api.get("/prices");
      const map = {};
      data.prices.forEach((p) => (map[p.symbol] = p));

      // attach direction from previous
      const enriched = data.prices.map((p) => {
        const prev = prevRef.current[p.symbol];
        const dir = prev
          ? p.price > prev.price
            ? "up"
            : p.price < prev.price
            ? "down"
            : "flat"
          : "flat";
        return { ...p, direction: dir };
      });

      prevRef.current = map;
      setPrices(enriched);
      setLoading(false);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    fetchPrices();
    const id = setInterval(fetchPrices, 10000);
    return () => clearInterval(id);
  }, []);

  return { prices, loading };
};

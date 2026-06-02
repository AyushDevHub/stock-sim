import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const BACKEND =
  import.meta.env.MODE === "production"
    ? import.meta.env.VITE_API_URL
    : "http://localhost:3000";

export const usePrices = () => {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const prevRef = useRef({});

  useEffect(() => {
    const socket = io(BACKEND, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    const enrich = (rawPrices) => {
      const enriched = rawPrices.map((p) => {
        const prev = prevRef.current[p.symbol];
        const dir = prev
          ? p.price > prev.price
            ? "up"
            : p.price < prev.price
            ? "down"
            : "flat"
          : p.direction ?? "flat";
        return { ...p, direction: dir };
      });
      const map = {};
      rawPrices.forEach((p) => (map[p.symbol] = p));
      prevRef.current = map;
      return enriched;
    };

    socket.on("connect", () => {
      setConnected(true);
      console.log("[usePrices] Socket connected");
    });

    socket.on("disconnect", () => {
      setConnected(false);
      console.log("[usePrices] Socket disconnected");
    });

    socket.on("prices:update", ({ prices: raw }) => {
      setPrices(enrich(raw));
      setLoading(false);
    });

    const token = localStorage.getItem("token");
    fetch(`${BACKEND}/prices`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.prices?.length) {
          setPrices(enrich(data.prices));
          setLoading(false);
        }
      })
      .catch(() => {});

    return () => {
      socket.disconnect();
    };
  }, []);

  return { prices, loading, connected };
};

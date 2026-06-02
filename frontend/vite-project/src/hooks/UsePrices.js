import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

// Socket.io connects to root of the backend (no /api suffix)
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.MODE === "production"
    ? "https://stock-sim-43d8.onrender.com"
    : "http://localhost:3000");

// REST calls go through the /api prefix
const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === "production"
    ? "https://stock-sim-43d8.onrender.com/api"
    : "/api");

export const usePrices = () => {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const prevRef = useRef({});

  useEffect(() => {
    const socket = io(SOCKET_URL, {
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
    fetch(`${API_URL}/prices`, {
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

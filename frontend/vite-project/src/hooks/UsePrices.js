import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.MODE === "production"
    ? "https://stock-sim-43d8.onrender.com"
    : "http://localhost:3000");

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === "production"
    ? "https://stock-sim-43d8.onrender.com/api"
    : "/api");

export const usePrices = () => {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [rateLimit, setRateLimit] = useState(null);
  const prevRef = useRef({});

  // Called by RateLimitBanner when countdown ends or user dismisses
  const clearRateLimit = useCallback(() => setRateLimit(null), []);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    // ── Direction enrichment ──────────────────────────────────────────────
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

    // ── Socket events ─────────────────────────────────────────────────────
    socket.on("connect", () => {
      setConnected(true);
      console.log("[usePrices] Socket connected");
    });

    socket.on("disconnect", () => {
      setConnected(false);
      console.log("[usePrices] Socket disconnected");
    });

    socket.on("prices:update", ({ prices: raw }) => {
      // Always update — never blank the UI on a rate-limit recovery
      setPrices(enrich(raw));
      setLoading(false);
      setRateLimit(null); // prices flowing → clear banner
    });

    socket.on("prices:rateLimit", (payload) => {
      console.warn("[usePrices] Rate limit:", payload);
      // Keep existing prices visible — just show the banner
      setRateLimit(payload);
      setLoading(false);
    });

    // ── HTTP fallback ─────────────────────────────────────────────────────
    // Fetches the cache snapshot so the page isn't blank during socket
    // handshake. Also picks up rateLimit state if we're currently throttled.
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/prices`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        // Hydrate prices if we have them (keeps UI populated before socket fires)
        if (data.prices?.length) {
          setPrices((prev) => (prev.length ? prev : enrich(data.prices)));
          setLoading(false);
        }
        // If server says we're rate-limited, show banner right away
        if (data.rateLimit?.limited) {
          setRateLimit({
            retryAt: data.rateLimit.retryAt,
            retryAfterMs: data.rateLimit.retryAfterMs,
            message:
              "Yahoo Finance rate limit hit. Prices will resume automatically.",
          });
        }
      })
      .catch(() => {});

    return () => socket.disconnect();
  }, []);

  return { prices, loading, connected, rateLimit, clearRateLimit };
};

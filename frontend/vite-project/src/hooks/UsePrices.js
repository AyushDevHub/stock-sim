import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

/**
 * usePrices — receives live prices pushed from the server via Socket.io.
 * Replaces the old polling-based version (no more setInterval + REST call).
 *
 * The socket connects to the same origin as the Vite dev server.
 * Vite proxies /socket.io/* → http://localhost:3000 (see vite.config.js).
 *
 * Falls back to the REST endpoint once on mount so the UI isn't blank
 * while waiting for the first socket push.
 */

let socket = null; // singleton — one connection shared across all hook instances

export const usePrices = () => {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const prevRef = useRef({});

  useEffect(() => {
    // ── Create socket once ──────────────────────────────────────────────
    if (!socket) {
      socket = io({
        // connects to window.location.origin; Vite proxy forwards to backend
        path: "/socket.io",
        transports: ["websocket", "polling"],
        withCredentials: true,
      });
    }

    // ── Helpers ─────────────────────────────────────────────────────────
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

    // ── Socket events ────────────────────────────────────────────────────
    const onConnect = () => {
      setConnected(true);
      console.log("[usePrices] Socket connected");
    };

    const onDisconnect = () => {
      setConnected(false);
      console.log("[usePrices] Socket disconnected");
    };

    const onPricesUpdate = ({ prices: raw }) => {
      setPrices(enrich(raw));
      setLoading(false);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("prices:update", onPricesUpdate);

    // ── REST fallback — fill UI immediately while waiting for first push ─
    const token = localStorage.getItem("token");
    fetch("/api/prices", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.prices?.length) {
          setPrices(enrich(data.prices));
          setLoading(false);
        }
      })
      .catch(() => {}); // silently ignore — socket will take over

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("prices:update", onPricesUpdate);
      // Do NOT call socket.disconnect() — the singleton stays alive
    };
  }, []);

  return { prices, loading, connected };
};

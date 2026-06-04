import { Server } from "socket.io";

let io = null;

// ─── Shared state pushed to every new connection ──────────────────────────────
// Stored here so clients that connect DURING a rate-limit period immediately
// receive the banner — they don't have to wait for the next poller tick.
let activeRateLimit = null; // { retryAfterMs, retryAt, message } | null

export const initSocket = (httpServer) => {
  const allowedOrigins = [
    "http://localhost:5173",
    "https://stock-sim-iota.vercel.app",
  ].filter(Boolean);

  console.log("[Socket.io] Allowed origins:", allowedOrigins);

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // ── Hydrate new client with current state ──────────────────────────────
    // 1. If we're rate-limited right now, tell the client immediately
    if (activeRateLimit && activeRateLimit.retryAt > Date.now()) {
      socket.emit("prices:rateLimit", activeRateLimit);
    }

    // 2. Send the full cached price snapshot so the UI is never blank
    //    (imported lazily to avoid circular dep at module init time)
    import("./pricePollerService.js").then(({ getAllPrices }) => {
      const prices = getAllPrices();
      if (prices.length) {
        socket.emit("prices:update", { prices, updatedAt: Date.now() });
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

// ─── Broadcast helpers ────────────────────────────────────────────────────────

/** Push fresh prices to every connected client */
export const emitPrices = (prices) => {
  if (!io) return;
  io.emit("prices:update", { prices, updatedAt: Date.now() });
};

/**
 * Broadcast a rate-limit event to all clients AND cache it so
 * clients that connect later also receive it immediately.
 */
export const emitRateLimit = ({ retryAfterMs, retryAt }) => {
  if (!io) return;
  activeRateLimit = {
    retryAfterMs,
    retryAt,
    message: "Yahoo Finance rate limit hit. Prices will resume automatically.",
  };
  io.emit("prices:rateLimit", activeRateLimit);
};

/**
 * Clear the cached rate-limit state.
 * Called by pricePollerService when a successful price fetch completes.
 */
export const clearRateLimit = () => {
  activeRateLimit = null;
};

export const getIO = () => io;

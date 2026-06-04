import { Server } from "socket.io";

let io = null;

// Store current rate-limit state so new connections get it immediately
let activRateLimit = null;

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

    // If we're currently rate-limited, immediately tell the new client
    // so they see the banner without waiting for the next poller tick
    if (activRateLimit && activRateLimit.retryAt > Date.now()) {
      socket.emit("prices:rateLimit", activRateLimit);
    }

    socket.on("disconnect", () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const emitPrices = (prices) => {
  if (!io) return;
  io.emit("prices:update", { prices, updatedAt: Date.now() });
};

/**
 * Emit a rate-limit notification to all connected clients and cache it
 * so new connections receive it too.
 */
export const emitRateLimit = ({ retryAfterMs, retryAt }) => {
  if (!io) return;
  activRateLimit = {
    retryAfterMs,
    retryAt,
    message: "Yahoo Finance rate limit hit. Prices will resume automatically.",
  };
  io.emit("prices:rateLimit", activRateLimit);
};

/**
 * Clear the cached rate-limit state. Called by pricePollerService
 * when a successful price fetch comes through.
 */
export const clearRateLimit = () => {
  activRateLimit = null;
};

export const getIO = () => io;

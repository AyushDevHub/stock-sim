import { Server } from "socket.io";

let io = null;

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
 * Emit a rate-limit notification to all connected clients.
 * @param {{ retryAfterMs: number, retryAt: number }} payload
 */
export const emitRateLimit = ({ retryAfterMs, retryAt }) => {
  if (!io) return;
  io.emit("prices:rateLimit", {
    retryAfterMs,
    retryAt,
    message: "Yahoo Finance rate limit hit. Prices will resume automatically.",
  });
};

export const getIO = () => io;

import { Server } from "socket.io";

let io = null;

/**
 * Call once from server.js after creating the http server.
 * Returns the io instance in case you need it elsewhere.
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
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

/**
 * Broadcast latest prices to every connected client.
 * Called by pricePollerService after each refresh.
 */
export const emitPrices = (prices) => {
  if (!io) return;
  io.emit("prices:update", { prices, updatedAt: Date.now() });
};

export const getIO = () => io;

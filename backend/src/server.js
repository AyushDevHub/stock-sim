import http from "http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js";
import { startPricePoller } from "./services/pricePollerService.js";
import { initSocket } from "./services/socketService.js";
import { initDigestScheduler } from "./services/eveningDigestService.js";

dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL_MS) || 60000;

console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("MONGO_URI exists:", !!process.env.MONGO_URI);

if (!MONGO_URI) {
  console.error("MONGO_URI missing");
  process.exit(1);
}

const httpServer = http.createServer(app);
initSocket(httpServer);

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");
    await startPricePoller(POLL_INTERVAL);
    initDigestScheduler(); // starts 6:30 PM IST cron
    httpServer.listen(PORT, () =>
      console.log(`Server + Socket.io running on port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error("DB connection failed:", err.message);
    process.exit(1);
  });

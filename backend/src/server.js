import http from "http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js";
import { startPricePoller } from "./services/pricePollerService.js";
import { initSocket } from "./services/socketService.js";

dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL_MS) || 1000;

if (!MONGO_URI) {
  console.error("MONGO_URI is not defined in .env");
  process.exit(1);
}

// Wrap Express in a plain http.Server so Socket.io can share the same port
const httpServer = http.createServer(app);

// Attach Socket.io to the http server
initSocket(httpServer);

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");
    await startPricePoller(POLL_INTERVAL);
    httpServer.listen(PORT, () =>
      console.log(`Server + Socket.io running on port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error("DB connection failed:", err.message);
    process.exit(1);
  });

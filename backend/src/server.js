import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js";
import { startPricePoller } from "./services/pricePollerService.js";

dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL_MS) || 10000; // default 10s

if (!MONGO_URI) {
  console.error("MONGO_URI is not defined in .env");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");

    // start price poller AFTER DB is connected (needs Stock model)
    await startPricePoller(POLL_INTERVAL);

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("DB connection failed:", err.message);
    process.exit(1);
  });

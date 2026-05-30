import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import tradeRoutes from "./routes/tradeRoutes.js";
import portfolioRoutes from "./routes/portfolioRoutes.js";
import stockRoutes from "./routes/stockRoutes.js";
import chartRoutes from "./routes/chartRoutes.js";
import priceRoutes from "./routes/priceRoutes.js";
import watchlistRoutes from "./routes/watchlistRoutes.js";
import scenarioRoutes from "./routes/scenarioRoutes.js";

const app = express();

/*
|--------------------------------------------------------------------------
| Middleware
|--------------------------------------------------------------------------
*/

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get("/health", (_, res) => {
  res.json({
    status: "ok",
    message: "Backend running successfully",
  });
});

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use("/auth", authRoutes);

app.use("/trade", tradeRoutes);

app.use("/portfolio", portfolioRoutes);

app.use("/stocks", stockRoutes);

app.use("/chart", chartRoutes);

app.use("/prices", priceRoutes);

app.use("/watchlist", watchlistRoutes);

/*
|--------------------------------------------------------------------------
| Scenario Routes
|--------------------------------------------------------------------------
*/

app.use("/api/scenarios", scenarioRoutes);

/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
  });
});

/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/

app.use((err, req, res, next) => {
  console.error("ERROR:", err);

  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

export default app;

import express from "express";
import authRoutes from "./routes/authRoutes.js";
import tradeRoutes from "./routes/tradeRoutes.js";
import portfolioRoutes from "./routes/portfolioRoutes.js";
import stockRoutes from "./routes/stockRoutes.js";
import chartRoutes from "./routes/chartRoutes.js";
import priceRoutes from "./routes/priceRoutes.js";

const app = express();
app.use(express.json());

app.get("/health", (_, res) => res.json({ status: "ok" }));
app.use("/auth", authRoutes);
app.use("/trade", tradeRoutes);
app.use("/portfolio", portfolioRoutes);
app.use("/stocks", stockRoutes);
app.use("/chart", chartRoutes);
app.use("/prices", priceRoutes);

app.use((_, res) => res.status(404).json({ message: "Route not found" }));
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Internal server error" });
});

export default app;

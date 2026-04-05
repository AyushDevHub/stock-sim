import express from "express";
import protect from "../middlewares/authMiddleware.js";
import { getChartData, getLiveQuote } from "../services/chartService.js";

const router = express.Router();

const VALID_INTERVALS = ["1m", "5m", "15m", "1h", "1d", "1wk", "1mo"];

/**
 * GET /chart/:symbol?interval=1d
 *
 * Returns full OHLCV candlestick + volume data.
 * interval options: 1m | 5m | 15m | 1h | 1d | 1wk | 1mo
 *
 * Example: GET /chart/TCS?interval=1d
 *          GET /chart/IRCTC?interval=5m
 *          GET /chart/MRF?interval=1wk
 */
router.get("/:symbol", protect, async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const interval = req.query.interval || "1d";

    if (!VALID_INTERVALS.includes(interval)) {
      return res.status(400).json({
        message: `Invalid interval. Valid options: ${VALID_INTERVALS.join(
          ", "
        )}`,
      });
    }

    const data = await getChartData(symbol, interval);
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
});

/**
 * GET /chart/:symbol/quote
 *
 * Returns live quote for polling (price ticker).
 * Call this every 5s from frontend to update the live price.
 *
 * Example: GET /chart/TCS/quote
 */
router.get("/:symbol/quote", protect, async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const data = await getLiveQuote(symbol);
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
});

export default router;

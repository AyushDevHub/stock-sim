import mongoose from "mongoose";

/**
 * TradeAnalytics — aggregated per-user trading performance metrics.
 * Updated after every trade. Powers the analytics dashboard.
 */
const tradeAnalyticsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Core performance
    winRate: { type: Number, default: 0 }, // %
    avgProfit: { type: Number, default: 0 }, // ₹ per winning trade
    avgLoss: { type: Number, default: 0 }, // ₹ per losing trade
    profitFactor: { type: Number, default: 0 }, // totalWins / totalLosses
    maxDrawdown: { type: Number, default: 0 }, // max % portfolio decline

    // Risk metrics
    riskScore: { type: Number, default: 50 }, // 0-100 (0=reckless, 100=disciplined)
    avgPositionSize: { type: Number, default: 0 }, // % of portfolio per trade
    avgHoldingTime: { type: Number, default: 0 }, // minutes

    // Behavioural / emotional
    emotionalScore: { type: Number, default: 50 }, // 0-100
    panicSellCount: { type: Number, default: 0 }, // sold during large drops
    fomoBuyCount: { type: Number, default: 0 }, // bought after large rallies
    revengeTrades: { type: Number, default: 0 }, // trade immediately after a loss

    // Volume stats
    totalTradesAll: { type: Number, default: 0 },
    totalBuys: { type: Number, default: 0 },
    totalSells: { type: Number, default: 0 },
    totalVolume: { type: Number, default: 0 }, // ₹

    // Scenario performance
    scenarioStats: [
      {
        scenarioId: String,
        attempts: Number,
        bestScore: Number,
        avgScore: Number,
      },
    ],

    // Daily P&L history (last 30 days)
    dailyPnL: [
      {
        date: Date,
        pnl: Number,
        trades: Number,
      },
    ],
  },
  { timestamps: true }
);

/**
 * Recalculate analytics from raw order data.
 * Call this after every trade or on-demand.
 */
tradeAnalyticsSchema.statics.recalculate = async function (userId, orders) {
  const buys = orders.filter((o) => o.type === "buy");
  const sells = orders.filter((o) => o.type === "sell");

  // Match sells to buys for P&L (simple FIFO approximation)
  let wins = 0,
    losses = 0,
    totalWin = 0,
    totalLoss = 0;

  sells.forEach((sell) => {
    const matchedBuy = buys.find((b) => b.stock === sell.stock);
    if (matchedBuy) {
      const pnl = (sell.price - matchedBuy.price) * sell.quantity;
      if (pnl > 0) {
        wins++;
        totalWin += pnl;
      } else {
        losses++;
        totalLoss += Math.abs(pnl);
      }
    }
  });

  const totalTrades = wins + losses;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const avgProfit = wins > 0 ? totalWin / wins : 0;
  const avgLoss = losses > 0 ? totalLoss / losses : 0;
  const profitFactor =
    totalLoss > 0 ? totalWin / totalLoss : totalWin > 0 ? 999 : 0;

  return this.findOneAndUpdate(
    { userId },
    {
      winRate,
      avgProfit,
      avgLoss,
      profitFactor,
      totalTradesAll: orders.length,
      totalBuys: buys.length,
      totalSells: sells.length,
      totalVolume: orders.reduce((s, o) => s + o.total, 0),
    },
    { upsert: true, new: true }
  );
};

export default mongoose.model("TradeAnalytics", tradeAnalyticsSchema);

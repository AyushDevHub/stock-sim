/**
 * bullMarket.js
 * Strong uptrend, sector rallies, positive news flow.
 * Teaches: trend following, momentum trading, riding winners.
 */

export const bullMarketScenario = {
  id: "bull_market",
  name: "Bull Market Rally",
  description:
    "Markets are ripping higher. Every dip gets bought. Riding the trend sounds easy — until it isn't. Learn momentum trading and when to lock profits.",
  difficulty: "beginner",
  duration: 180, // seconds
  volatility: 0.3, // relatively calm
  marketTrend: 0.7, // strongly positive
  startingCash: 100000, // ₹1 lakh
  scoringMetric: "profit", // maximise P&L
  tags: ["trend", "momentum", "entry timing"],
  events: [
    {
      time: 15,
      title: "🚀 FII Buying Surge",
      description:
        "Foreign institutional investors pouring ₹3,000 Cr into large-caps.",
      impact: 3,
      sector: "all",
    },
    {
      time: 45,
      title: "📈 GDP Data Beats Estimates",
      description:
        "India GDP grows 8.4% — highest in 6 quarters. Markets cheer.",
      impact: 5,
      sector: "banking",
    },
    {
      time: 80,
      title: "💊 Pharma Sector Rally",
      description: "US FDA approvals for 3 Indian pharma companies in one day.",
      impact: 8,
      sector: "pharma",
    },
    {
      time: 120,
      title: "⚠️ Profit Booking Dip",
      description:
        "Markets pull back briefly as traders lock profits. Buy the dip?",
      impact: -4,
      sector: "all",
    },
    {
      time: 155,
      title: "🏦 RBI Cuts Rates",
      description: "Surprise 25bps cut. Rate-sensitive sectors fly.",
      impact: 6,
      sector: "banking",
    },
  ],
  learningObjectives: [
    "Enter positions during trend continuations",
    "Don't panic-sell brief pullbacks",
    "Set partial profit targets as markets extend",
  ],
};

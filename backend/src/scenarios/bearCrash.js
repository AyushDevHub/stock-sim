/**
 * bearCrash.js
 * Sudden, violent market collapse.
 * Teaches: panic control, capital preservation, stop losses.
 */

export const bearCrashScenario = {
  id: "bear_crash",
  name: "Bear Market Crash",
  description:
    "Everything is falling. Your portfolio is bleeding. Can you preserve capital while others panic-sell? One wrong move and you're wiped out.",
  difficulty: "intermediate",
  duration: 180,
  volatility: 0.8,
  marketTrend: -0.6,
  startingCash: 100000,
  scoringMetric: "capital_preserved", // lose the least
  tags: ["risk management", "stop-loss", "panic control"],
  events: [
    {
      time: 10,
      title: "🔴 Global Sell-Off Begins",
      description:
        "US markets crash overnight. Asian markets open in deep red.",
      impact: -8,
      sector: "all",
    },
    {
      time: 30,
      title: "🏦 Banking Crisis Emerges",
      description:
        "Major private bank reports ₹15,000 Cr NPA. Stocks circuit-down.",
      impact: -15,
      sector: "banking",
    },
    {
      time: 55,
      title: "📰 Inflation Hits 9%",
      description: "Retail inflation spikes. RBI emergency meeting called.",
      impact: -6,
      sector: "all",
    },
    {
      time: 90,
      title: "⬆️ Dead Cat Bounce",
      description:
        "Brief relief rally as bargain hunters step in. Is the bottom in?",
      impact: 7,
      sector: "all",
    },
    {
      time: 110,
      title: "💀 Bounce Fails",
      description: "Rally evaporates. Sellers overwhelm buyers again.",
      impact: -10,
      sector: "all",
    },
    {
      time: 140,
      title: "🏛️ Fed Rate Hike",
      description:
        "US Fed hikes 75bps. Emerging market capital flight accelerates.",
      impact: -12,
      sector: "all",
    },
    {
      time: 165,
      title: "🕊️ Circuit Breaker Triggered",
      description: "SEBI halts trading for 15 minutes. Markets on edge.",
      impact: 0,
      sector: "all",
      isHalt: true,
    },
  ],
  learningObjectives: [
    "Set stop-losses before entering positions",
    "Resist the urge to average down in freefall",
    "Identify dead cat bounces vs genuine reversals",
    "Cash is a position — sometimes the best one",
  ],
};

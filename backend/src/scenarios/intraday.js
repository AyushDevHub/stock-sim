/**
 * intraday.js
 * 15-minute blitz. ₹1L virtual cash. Leaderboard-ranked.
 * Pure speed and instinct — tests execution, not just strategy.
 */

export const intradayScenario = {
  id: "intraday",
  name: "Intraday Blitz",
  description:
    "15 minutes. ₹1 lakh. Cutthroat leaderboard. Every second counts. Can you out-trade 1000 other players in real-time conditions?",
  difficulty: "expert",
  duration: 900, // 15 minutes = 900 seconds
  volatility: 0.65,
  marketTrend: 0.1, // slight upward bias typical of open
  startingCash: 100000,
  scoringMetric: "leaderboard_rank",
  isCompetitive: true,
  tags: ["speed", "leaderboard", "intraday", "competitive"],
  phases: [
    {
      name: "Market Open (9:15 AM)",
      startTime: 0,
      endTime: 180,
      volatility: 0.9, // most volatile — opening gap fills
      trend: 0.2,
      description:
        "Wild swings as overnight positions unwind. Highest risk, highest reward.",
    },
    {
      name: "Mid-Morning Consolidation",
      startTime: 180,
      endTime: 450,
      volatility: 0.4,
      trend: 0.05,
      description:
        "Markets settle. Trend becomes clearer. Best time for trend trades.",
    },
    {
      name: "Afternoon Momentum",
      startTime: 450,
      endTime: 720,
      volatility: 0.5,
      trend: 0.15,
      description:
        "FII activity picks up. Volume surges. Momentum plays work well.",
    },
    {
      name: "Power Hour (3:15 PM)",
      startTime: 720,
      endTime: 900,
      volatility: 0.75,
      trend: -0.1, // late sell-off common
      description:
        "Last 15 minutes. Traders square positions. Expect sharp moves.",
    },
  ],
  events: [
    {
      time: 30,
      title: "Opening Gap Up",
      description: "Nifty opens 120 points above yesterday's close.",
      impact: 2,
      sector: "all",
    },
    {
      time: 200,
      title: "Block Deal in Banking",
      description:
        "Insider block deal worth ₹800Cr executed. Signal of smart money.",
      impact: 4,
      sector: "banking",
    },
    {
      time: 500,
      title: "Option Expiry Squeeze",
      description: "Weekly options expiry. 18500 CE writers scramble to cover.",
      impact: 5,
      sector: "nifty",
    },
    {
      time: 750,
      title: "Sell on Close Alert",
      description:
        "Index mutual funds rebalancing triggers late sell pressure.",
      impact: -3,
      sector: "all",
    },
  ],
  rules: [
    "Positions must be squared off at end of session",
    "Maximum 5 trades per stock",
    "Brokerage: ₹20 flat per order",
    "No short selling (buy first)",
  ],
  scoring: {
    base: "final_portfolio_value",
    bonus: {
      winRate: 0.3, // 30% weight on win rate
      maxDrawdown: -0.2, // penalty for large drawdown
      tradeCount: 0.1, // bonus for more activity
    },
  },
};

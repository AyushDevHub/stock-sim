/**
 * covidCrash.js — COVID-19 Market Crash (March 2020)
 *
 * The most psychologically intense scenario in StockSim.
 * Recreates the 40% NIFTY crash in 38 days — fastest crash in history.
 *
 * PHASE SYSTEM:
 *   Phase 1 — Normal Market (calm, users get complacent)
 *   Phase 2 — Panic Begins  (COVID news, -5% drop, decision fork)
 *   Phase 3 — Full Crash    (circuit breakers, -15%, 20s timer)
 *   Phase 4 — Decision Test (behavior evaluation)
 *   Phase 5 — Recovery      (gradual bounce, late buyers win)
 *
 * KEY MECHANIC: Phase 3 triggers regardless of user action (no escape).
 * This is intentional — models real market inevitability.
 */

export const covidCrashScenario = {
  id: "covid_crash",
  name: "COVID Crash: March 2020",
  tagline: "The fastest market crash in history. Can you survive it?",
  description:
    "March 2020. NIFTY loses 40% in 38 days. Circuit breakers trigger 3 times. ₹17 lakh crore wiped out. You're a trader watching it happen in real-time. Every decision you make will be evaluated — not just for profit, but for psychology.",
  difficulty: "intermediate",
  duration: 300, // 5 minutes = compressed 38-day crash
  volatility: 0.4,
  marketTrend: -0.2,
  startingCash: 100000,
  scoringMetric: "psychology_score",
  isHistoric: true,
  historicPeriod: "Feb 19, 2020 — Mar 23, 2020",
  tags: ["Historic Crash", "Psychology", "Risk Management", "FOMO"],
  psychBadge: "CRISIS TESTED",
  reward: 3000,
  icon: "🦠",
  color: "#ef4444",
  players: 0,
  completionRate: 0,
  isCompetitive: false,
  isLive: false,

  // Phase configuration — controls market behavior per phase
  phases: [
    {
      id: "normal",
      name: "Phase 1 — Normal Market",
      startTime: 0,
      endTime: 60,
      volatility: 0.2,
      marketTrend: 0.05,
      sentimentBias: 0, // neutral
      systemMessage:
        "Markets are stable. Some news of a virus spreading in China, but analysts say impact will be limited to Asia.",
      context: "NIFTY: 12,130 | VIX: 14.2 | FII: Net Buyers",
    },
    {
      id: "panic_begins",
      name: "Phase 2 — Panic Begins",
      startTime: 60,
      endTime: 120,
      volatility: 0.55,
      marketTrend: -0.4,
      sentimentBias: -25,
      systemMessage:
        "COVID-19 cases rising rapidly. WHO declares public health emergency. Italy enters lockdown.",
      context: "NIFTY: 11,201 | VIX: 28.7 | FII: Net Sellers",
    },
    {
      id: "crash",
      name: "Phase 3 — Market Crash",
      startTime: 120,
      endTime: 200,
      volatility: 0.95,
      marketTrend: -0.85,
      sentimentBias: -45,
      systemMessage:
        "CIRCUIT BREAKER TRIGGERED. All trading halted for 45 minutes. Global markets in freefall.",
      context: "NIFTY: 9,508 | VIX: 83.6 | FII: Panic Sell",
      hasTimer: true,
      timerSeconds: 20,
      isCompulsory: true, // triggers regardless of user action
    },
    {
      id: "decision_test",
      name: "Phase 4 — The Test",
      startTime: 200,
      endTime: 240,
      volatility: 0.7,
      marketTrend: -0.3,
      sentimentBias: -35,
      systemMessage:
        "Markets resume after halt. Selling continues but at slower pace. This is your decision window.",
      context: "NIFTY: 9,800 | VIX: 71.2 | FII: Still Selling",
    },
    {
      id: "recovery",
      name: "Phase 5 — Recovery",
      startTime: 240,
      endTime: 300,
      volatility: 0.5,
      marketTrend: 0.6,
      sentimentBias: +20,
      systemMessage:
        "RBI announces emergency stimulus. US Fed cuts rates to zero. Smart money starts accumulating.",
      context: "NIFTY: 11,300 | VIX: 42.1 | FII: Cautious Buyers",
    },
  ],

  // Events — mapped to simulation seconds (not real days)
  events: [
    // ── Phase 1: Normal market ──────────────────────────────────────────
    {
      time: 10,
      phase: "normal",
      title: "📰 China Reports New Virus",
      description:
        "A novel coronavirus reported in Wuhan. WHO says risk to global health is low. Markets shrug.",
      impact: -1,
      sector: "all",
      isWarning: false,
      hint: null,
    },
    {
      time: 30,
      phase: "normal",
      title: "📈 Sensex hits 41,953 — All-Time High",
      description:
        "Markets at record highs. FII inflows strong. Budget rally continuing. Nothing to worry about.",
      impact: 2,
      sector: "all",
      isWarning: false,
      isFOMO: true, // triggers FOMO mechanic
      fomoMessage:
        "Everyone's making money. Are you buying? Market is at all-time highs.",
      hint: null,
    },
    {
      time: 50,
      phase: "normal",
      title: "🌍 Italy Reports First Deaths",
      description:
        "26 cases in Italy. Markets dip slightly but analysts say this is an overreaction.",
      impact: -2,
      sector: "all",
      isWarning: true,
      hint: "This is the first real warning signal. Most traders ignore it.",
    },

    // ── Phase 2: Panic begins ───────────────────────────────────────────
    {
      time: 65,
      phase: "panic_begins",
      title: "🚨 COVID-19: WHO Declares Global Emergency",
      description:
        "World Health Organization declares COVID-19 a Public Health Emergency of International Concern. 30+ countries report cases.",
      impact: -5,
      sector: "all",
      isBreaking: true,
      isWarning: true,
      hint: "First major shock. NIFTY drops ~500 points in minutes.",
    },
    {
      time: 80,
      phase: "panic_begins",
      title: "✈️ Travel & Aviation Collapse",
      description:
        "IndiGo, SpiceJet, Air India stocks in freefall. Oil demand destruction begins. Aviation down -20% in a week.",
      impact: -8,
      sector: "aviation",
      isBreaking: false,
      hint: "Sector-specific collapse. Defensives holding better than cyclicals.",
    },
    {
      time: 95,
      phase: "panic_begins",
      title: "🏦 FII Selling ₹6,000 Cr in a Single Day",
      description:
        "Foreign investors pulling out at record pace. Rupee weakening. Dollar at ₹74.",
      impact: -6,
      sector: "all",
      isBreaking: true,
      hint: "FII selling is the real accelerator. Domestic institutions can't absorb this.",
      decisionWindow: 30,
    },
    {
      time: 110,
      phase: "panic_begins",
      title: "🌍 US Declares National Emergency",
      description:
        "Trump declares national emergency. US markets circuit-break for first time since 1997. Dow down -10% in a day.",
      impact: -9,
      sector: "all",
      isBreaking: true,
      hint: "When US sneezes, India catches a cold. This is that moment.",
    },

    // ── Phase 3: Crash — COMPULSORY ────────────────────────────────────
    {
      time: 125,
      phase: "crash",
      title: "💥 CIRCUIT BREAKER: NIFTY -13.9% — TRADING HALTED",
      description:
        "SEBI triggers Level 1 circuit breaker. All equity trading halted for 45 minutes. This is only the 4th time in history this has happened. March 13, 2020.",
      impact: -14,
      sector: "all",
      isBreaking: true,
      isCrash: true,
      hasTimer: true,
      timerSeconds: 20,
      isCompulsory: true,
      psychMessage:
        "⚠️ Your portfolio is flashing red. Most traders panic-sell in the next 20 seconds.",
      hint: "The worst single-day fall since 2008. What do you do?",
    },
    {
      time: 150,
      phase: "crash",
      title: "🩸 RELIANCE -14% | HDFC Bank -16% | TCS -12%",
      description:
        "Even the Nifty heavyweights are bleeding. No stock is safe. Cash is king right now.",
      impact: -10,
      sector: "all",
      isBreaking: false,
      isCrash: true,
      hint: "Blue chips falling this hard = once-in-a-decade buying opportunity... or further crash.",
    },
    {
      time: 170,
      phase: "crash",
      title: "💀 SECOND CIRCUIT BREAKER — March 23, 2020",
      description:
        "NIFTY hits 7,511. Down 38% from all-time high. ₹17 lakh crore in market cap destroyed in 38 days. Historic.",
      impact: -12,
      sector: "all",
      isBreaking: true,
      isCrash: true,
      hasTimer: true,
      timerSeconds: 20,
      psychMessage:
        "Portfolio down 30%+. Losses are real. Do you cut losses or hold?",
    },

    // ── Phase 4: Decision test ──────────────────────────────────────────
    {
      time: 205,
      phase: "decision_test",
      title: "🕊️ Markets Resume — Slower Bleeding",
      description:
        "Circuit breaker halts over. Selling continues but pace slows. Some bottom-fishers visible.",
      impact: -3,
      sector: "all",
      isBreaking: false,
      hint: "Is the bottom in? Nobody knows. This is the hardest decision.",
    },
    {
      time: 220,
      phase: "decision_test",
      title: "📊 Rakesh Jhunjhunwala Buying Titan",
      description:
        "India's biggest investor is buying. 'This is a once-in-a-decade opportunity' — RJ.",
      impact: 2,
      sector: "fmcg",
      isBreaking: false,
      isFOMO: true,
      fomoMessage:
        "Smart money is buying. Are you a buyer or a spectator right now?",
      hint: "Smart money buys fear. This is the signal.",
    },
    {
      time: 235,
      phase: "decision_test",
      title: "📉 NIFTY at 7,511 — 11-Year Low",
      description:
        "Back to 2009 levels. Most retail investors in deep loss. Many have stopped looking at their portfolios.",
      impact: -4,
      sector: "all",
      isBreaking: false,
      psychMessage:
        "Stocks are cheaper than they've been in 11 years. But they could go cheaper.",
    },

    // ── Phase 5: Recovery ───────────────────────────────────────────────
    {
      time: 245,
      phase: "recovery",
      title: "🏦 RBI Emergency Rate Cut — 75bps",
      description:
        "RBI Governor announces emergency 75bps rate cut + ₹3.74 lakh crore liquidity injection. Largest stimulus in RBI history.",
      impact: 8,
      sector: "banking",
      isBreaking: true,
      hint: "Policy response = bottom signal. Central banks will not let markets collapse.",
    },
    {
      time: 260,
      phase: "recovery",
      title: "🌍 US Fed: Rate Cut to Zero + $700B QE",
      description:
        "Fed cuts rates to 0-0.25%. Unlimited bond buying. This is the 'whatever it takes' moment.",
      impact: 10,
      sector: "all",
      isBreaking: true,
      hint: "Coordinated global central bank response. This is how crashes end.",
    },
    {
      time: 275,
      phase: "recovery",
      title: "📈 NIFTY Bounces +8% in a Single Day",
      description:
        "Bargain hunters flood in. Short covers add fuel. Those who bought at 7,500-8,000 are up 30%+ in months.",
      impact: 9,
      sector: "all",
      isBreaking: false,
      isFOMO: true,
      fomoMessage:
        "Those who bought during the crash are now making 30%. Did you?",
    },
    {
      time: 290,
      phase: "recovery",
      title: "💊 Pharma & IT Lead Recovery",
      description:
        "Work-from-home boom. Healthcare demand surge. Sun Pharma +40%, Infosys +35% from lows.",
      impact: 7,
      sector: "pharma",
      isBreaking: false,
      hint: "Sector rotation post-crash: pharma, IT, FMCG lead. Cyclicals lag.",
    },
  ],

  // Psychology scoring — what decisions was the user rewarded/penalized for
  psychologyMetrics: {
    panicSell: {
      trigger: "sold_during_crash", // sold during phase 3
      label: "Panic Seller",
      score: -30,
      feedback:
        "You sold at peak panic — exactly when smart money was buying. This is the most common retail mistake. Fear-driven exits lock in maximum losses.",
      icon: "😱",
    },
    holdSurvivor: {
      trigger: "held_through_crash", // held through phase 3 without selling
      label: "Survivor",
      score: +10,
      feedback:
        "You held through the crash without a strategy. You got lucky this time — markets recovered. But without a plan, this is just hope, not investing.",
      icon: "😤",
    },
    smartBuyer: {
      trigger: "bought_during_crash", // bought during phase 3 or 4
      label: "Smart Investor",
      score: +40,
      feedback:
        "You identified opportunity in fear. Buying quality stocks during a crash is exactly what Buffett means by 'be greedy when others are fearful'. This is how wealth is built.",
      icon: "🧠",
    },
    diversified: {
      trigger: "spread_across_3_stocks",
      label: "Diversified",
      score: +15,
      feedback:
        "You spread risk across multiple stocks. Diversification didn't eliminate losses but limited concentration risk.",
      icon: "⚖️",
    },
    concentrated: {
      trigger: "all_in_one_stock",
      label: "Concentrated Risk",
      score: -15,
      feedback:
        "All capital in one stock during a crash = maximum volatility exposure. In 2020, even blue chips fell 30-40%. Never go all-in on one name.",
      icon: "🎰",
    },
  },

  // Learning outcomes shown post-scenario
  learningObjectives: [
    "Crashes happen fast — preparation before entry matters more than decisions during the fall",
    "Smart money buys fear, not confirmation",
    "Diversification limits damage even when everything falls",
    "Central bank policy response is the most reliable crash signal",
    "Your psychology under pressure reveals your real risk tolerance",
  ],

  // Historic context shown in briefing
  historicContext: {
    crash: {
      from: "12,430 (Feb 19, 2020)",
      to: "7,511 (Mar 23, 2020)",
      drawdown: "-39.5%",
      days: 38,
      note: "Fastest crash from peak to trough in NIFTY history",
    },
    recovery: {
      from: "7,511 (Mar 23, 2020)",
      to: "13,981 (Dec 31, 2020)",
      gain: "+86.1%",
      days: 283,
      note: "Those who bought at bottom and held saw near-doubling in 9 months",
    },
  },
};

import { getAllScenarios, getScenarioById } from "../scenarios/index.js";
import { simulatePriceSeries } from "../scenarios/priceEngine.js";
import UserProgress from "../models/UserProgress.js";

/**
 * GET /api/scenarios
 * Returns all available scenarios (metadata only, no full event details)
 */
export const listScenarios = (req, res) => {
  const scenarios = getAllScenarios().map(
    ({
      id,
      name,
      description,
      difficulty,
      duration,
      tags,
      isCompetitive,
      isHistoric,
      historicPeriod,
    }) => ({
      id,
      name,
      description,
      difficulty,
      duration,
      tags,
      isCompetitive: isCompetitive ?? false,
      isHistoric: isHistoric ?? false,
      historicPeriod: historicPeriod ?? null,
    })
  );
  res.json({ scenarios });
};

/**
 * GET /api/scenarios/:id
 * Returns full scenario config including events (needed to start the session)
 */
export const getScenario = (req, res) => {
  const scenario = getScenarioById(req.params.id);
  if (!scenario) return res.status(404).json({ message: "Scenario not found" });
  res.json({ scenario });
};

/**
 * POST /api/scenarios/:id/simulate
 * Pre-generates a full price series for a scenario (for replay / chart preview)
 * Body: { symbol, startPrice }
 */
export const simulateScenario = (req, res) => {
  const scenario = getScenarioById(req.params.id);
  if (!scenario) return res.status(404).json({ message: "Scenario not found" });

  const { startPrice = 1000 } = req.body;

  try {
    const prices = simulatePriceSeries(startPrice, scenario);
    res.json({
      scenarioId: scenario.id,
      prices,
      events: scenario.events,
      duration: scenario.duration,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /api/scenarios/:id/complete
 * Called when user finishes a scenario session.
 *
 * Body (standard): { finalPortfolioValue, tradeCount, winRate }
 * Body (covid_crash extended): { finalPortfolioValue, tradeCount, winRate,
 *   boughtDuringCrash, soldDuringCrash, heldThroughCrash,
 *   stockCount, decisions }
 */
export const completeScenario = async (req, res) => {
  const scenario = getScenarioById(req.params.id);
  if (!scenario) return res.status(404).json({ message: "Scenario not found" });

  const {
    finalPortfolioValue = 0,
    tradeCount = 0,
    winRate = 0,
    // COVID-specific psychology signals
    boughtDuringCrash = false,
    soldDuringCrash = false,
    heldThroughCrash = false,
    stockCount = 1,
    decisions = [],
  } = req.body;

  const startingCash = scenario.startingCash ?? 100000;
  const returnPct = ((finalPortfolioValue - startingCash) / startingCash) * 100;

  const difficultyMultiplier =
    { beginner: 1, intermediate: 1.5, advanced: 2, expert: 3 }[
      scenario.difficulty
    ] ?? 1;

  // ── COVID-specific psychology score ──────────────────────────────────────
  let psychologyBonus = 0;
  let psychTitle = "Survivor";
  let psychIcon = "😤";
  let psychFeedback = [];
  let behaviorBreakdown = [];

  if (scenario.id === "covid_crash") {
    // Core psychology evaluation
    if (boughtDuringCrash) {
      psychologyBonus += 40;
      psychTitle = "Smart Investor";
      psychIcon = "🧠";
      psychFeedback.push(
        "You bought during peak fear — exactly how smart money acts. Buffett's 'be greedy when others are fearful' in practice."
      );
      behaviorBreakdown.push({
        label: "Bought during crash",
        impact: "+40 pts",
        type: "positive",
        detail: "Identified opportunity in fear. This is rare.",
      });
    } else if (soldDuringCrash) {
      psychologyBonus -= 30;
      psychTitle = "Panic Seller";
      psychIcon = "😱";
      psychFeedback.push(
        "You sold at peak panic. This is the most common and costly retail mistake — locking in maximum losses right before recovery."
      );
      behaviorBreakdown.push({
        label: "Sold during crash",
        impact: "-30 pts",
        type: "negative",
        detail: "Emotion overrode strategy. Fear-driven exit.",
      });
    } else if (heldThroughCrash) {
      psychologyBonus += 10;
      psychTitle = "Survivor";
      psychIcon = "😤";
      psychFeedback.push(
        "You held through the crash. Lucky it recovered — but holding without a strategy is hope, not investing."
      );
      behaviorBreakdown.push({
        label: "Held through crash",
        impact: "+10 pts",
        type: "neutral",
        detail: "Survived but no clear strategy executed.",
      });
    }

    // Diversification check
    if (stockCount >= 3) {
      psychologyBonus += 15;
      psychFeedback.push(
        "You spread across 3+ stocks — diversification limited concentration risk during the fall."
      );
      behaviorBreakdown.push({
        label: "Diversified portfolio",
        impact: "+15 pts",
        type: "positive",
        detail: "3+ stocks held. Risk spread correctly.",
      });
    } else if (stockCount === 1 && tradeCount > 0) {
      psychologyBonus -= 15;
      psychFeedback.push(
        "All capital in one stock during a crash = maximum volatility. Never go all-in on one name."
      );
      behaviorBreakdown.push({
        label: "Concentrated risk",
        impact: "-15 pts",
        type: "negative",
        detail: "All capital in single stock. High exposure.",
      });
    }

    // Decision quality from decisions array
    const phaseDecisions = {
      normal: decisions.filter((d) => d.phase === "normal").length,
      panic: decisions.filter((d) => d.phase === "panic_begins").length,
      crash: decisions.filter((d) => d.phase === "crash").length,
      recovery: decisions.filter((d) => d.phase === "recovery").length,
    };

    if (phaseDecisions.recovery > 0) {
      psychologyBonus += 10;
      behaviorBreakdown.push({
        label: "Acted during recovery",
        impact: "+10 pts",
        type: "positive",
        detail: "Positioned for the bounce.",
      });
    }

    if (phaseDecisions.normal > 2) {
      behaviorBreakdown.push({
        label: "Active in calm market",
        impact: "0 pts",
        type: "neutral",
        detail: "Built positions before volatility. Mixed signal.",
      });
    }
  }

  // ── Final score ───────────────────────────────────────────────────────────
  const baseScore = Math.max(
    0,
    (returnPct * 10 + winRate * 2) * difficultyMultiplier
  );
  const rawScore = baseScore + psychologyBonus;
  const score = Math.round(Math.max(0, Math.min(rawScore, 999)));

  const xpReward = Math.round(score * 0.5) + 50;

  try {
    let progress = await UserProgress.findOne({ userId: req.user._id });
    if (!progress) {
      progress = new UserProgress({ userId: req.user._id });
    }

    const existing = progress.completedScenarios.find(
      (s) => s.scenarioId === scenario.id
    );
    if (existing) {
      if (score > existing.score) existing.score = score;
      existing.completedAt = new Date();
    } else {
      progress.completedScenarios.push({
        scenarioId: scenario.id,
        score,
        completedAt: new Date(),
      });
    }

    await progress.addXP(xpReward);

    const newAchievements = [];
    const gained = checkAchievements(progress, {
      returnPct,
      scenario,
      tradeCount,
      winRate,
      boughtDuringCrash,
      soldDuringCrash,
      heldThroughCrash,
      psychologyBonus,
    });
    newAchievements.push(...gained);
    if (gained.length > 0) await progress.save();
    else await progress.save();

    res.json({
      score,
      xpEarned: xpReward,
      returnPct: returnPct.toFixed(2),
      newLevel: progress.level,
      newAchievements,
      // COVID-specific response fields
      psychTitle,
      psychIcon,
      psychFeedback,
      behaviorBreakdown,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/scenarios/progress
 * Returns the current user's XP, level, achievements, completed scenarios
 */
export const getUserProgress = async (req, res) => {
  try {
    let progress = await UserProgress.findOne({ userId: req.user._id });
    if (!progress) {
      progress = await UserProgress.create({ userId: req.user._id });
    }
    res.json({ progress });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Achievement definitions ──────────────────────────────────────────────────

const ACHIEVEMENTS = [
  {
    id: "first_trade",
    name: "First Blood",
    description: "Complete your first trade",
    xpReward: 100,
  },
  {
    id: "first_profit",
    name: "In The Green",
    description: "Finish a scenario with profit",
    xpReward: 200,
  },
  {
    id: "survivor",
    name: "Bear Survivor",
    description: "Survive the Bear Crash scenario",
    xpReward: 500,
  },
  {
    id: "precision",
    name: "Sniper",
    description: "Achieve 80%+ win rate in any scenario",
    xpReward: 300,
  },
  {
    id: "bull_rider",
    name: "Bull Rider",
    description: "Make 20%+ return in Bull Market",
    xpReward: 400,
  },
  {
    id: "speed_demon",
    name: "Speed Demon",
    description: "Complete Intraday Blitz",
    xpReward: 600,
  },
  {
    id: "news_hawk",
    name: "News Hawk",
    description: "React correctly to 4+ news events",
    xpReward: 350,
  },
  // COVID-specific achievements
  {
    id: "covid_smart_buyer",
    name: "Crisis Capitalist",
    description: "Buy stocks during the COVID crash phase",
    xpReward: 800,
  },
  {
    id: "covid_survivor",
    name: "Black Swan Survivor",
    description: "Hold through the COVID crash without panic-selling",
    xpReward: 500,
  },
  {
    id: "covid_profit",
    name: "March 2020 Legend",
    description: "End COVID scenario with profit",
    xpReward: 1000,
  },
  {
    id: "contrarian",
    name: "Contrarian",
    description: "Score 'Smart Investor' in any crash scenario",
    xpReward: 600,
  },
];

function checkAchievements(progress, context) {
  const earned = [];
  const existing = new Set(progress.achievements.map((a) => a.id));

  for (const ach of ACHIEVEMENTS) {
    if (existing.has(ach.id)) continue;
    let unlocked = false;

    if (ach.id === "first_trade" && context.tradeCount > 0) unlocked = true;
    if (ach.id === "first_profit" && context.returnPct > 0) unlocked = true;
    if (ach.id === "survivor" && context.scenario.id === "bear_crash")
      unlocked = true;
    if (ach.id === "precision" && context.winRate >= 80) unlocked = true;
    if (
      ach.id === "bull_rider" &&
      context.scenario.id === "bull_market" &&
      context.returnPct >= 20
    )
      unlocked = true;
    if (ach.id === "speed_demon" && context.scenario.id === "intraday")
      unlocked = true;
    if (
      ach.id === "news_hawk" &&
      context.scenario.id === "news_reaction" &&
      context.winRate >= 80
    )
      unlocked = true;

    // COVID achievements
    if (
      ach.id === "covid_smart_buyer" &&
      context.scenario.id === "covid_crash" &&
      context.boughtDuringCrash
    )
      unlocked = true;
    if (
      ach.id === "covid_survivor" &&
      context.scenario.id === "covid_crash" &&
      context.heldThroughCrash &&
      !context.soldDuringCrash
    )
      unlocked = true;
    if (
      ach.id === "covid_profit" &&
      context.scenario.id === "covid_crash" &&
      context.returnPct > 0
    )
      unlocked = true;
    if (
      ach.id === "contrarian" &&
      context.boughtDuringCrash &&
      context.psychologyBonus >= 40
    )
      unlocked = true;

    if (unlocked) {
      progress.achievements.push({ ...ach, unlockedAt: new Date() });
      earned.push(ach);
    }
  }

  return earned;
}

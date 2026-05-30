import { getAllScenarios, getScenarioById } from "../scenarios/index.js";
import { simulatePriceSeries } from "../scenarios/priceEngine.js";
import UserProgress from "../models/UserProgress.js";

/**
 * GET /api/scenarios
 * Returns all available scenarios (metadata only, no full event details)
 */
export const listScenarios = (req, res) => {
  const scenarios = getAllScenarios().map(
    ({ id, name, description, difficulty, duration, tags, isCompetitive }) => ({
      id,
      name,
      description,
      difficulty,
      duration,
      tags,
      isCompetitive: isCompetitive ?? false,
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
 * Body: { finalPortfolioValue, tradeCount, winRate }
 * Awards XP, updates UserProgress.completedScenarios
 */
export const completeScenario = async (req, res) => {
  const scenario = getScenarioById(req.params.id);
  if (!scenario) return res.status(404).json({ message: "Scenario not found" });

  const { finalPortfolioValue = 0, tradeCount = 0, winRate = 0 } = req.body;

  const startingCash = scenario.startingCash ?? 100000;
  const returnPct = ((finalPortfolioValue - startingCash) / startingCash) * 100;

  // Score: blend of return + win rate + difficulty multiplier
  const difficultyMultiplier =
    { beginner: 1, intermediate: 1.5, advanced: 2, expert: 3 }[
      scenario.difficulty
    ] ?? 1;
  const rawScore = Math.max(
    0,
    (returnPct * 10 + winRate * 2) * difficultyMultiplier
  );
  const score = Math.round(rawScore);

  // XP reward
  const xpReward = Math.round(score * 0.5) + 50;

  try {
    let progress = await UserProgress.findOne({ userId: req.user._id });
    if (!progress) {
      progress = new UserProgress({ userId: req.user._id });
    }

    // Update completed scenarios
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

    // Check achievements
    const newAchievements = [];
    const gained = checkAchievements(progress, {
      returnPct,
      scenario,
      tradeCount,
      winRate,
    });
    newAchievements.push(...gained);
    if (gained.length > 0) await progress.save();

    res.json({
      score,
      xpEarned: xpReward,
      returnPct: returnPct.toFixed(2),
      newLevel: progress.level,
      newAchievements,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/progress
 * Returns the current user's XP, level, achievements, stats
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

// ─── Achievement logic ────────────────────────────────────────────────────────

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

    if (unlocked) {
      progress.achievements.push({ ...ach, unlockedAt: new Date() });
      earned.push(ach);
    }
  }

  return earned;
}

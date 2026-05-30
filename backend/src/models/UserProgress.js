import mongoose from "mongoose";

/**
 * UserProgress — tracks XP, level, streaks, achievements
 * One document per user.
 */

const achievementSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: String,
  description: String,
  unlockedAt: { type: Date, default: Date.now },
  xpReward: { type: Number, default: 0 },
});

const userProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // XP & Levelling
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    xpToNextLevel: { type: Number, default: 500 },

    // Streak
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date },

    // Scenario progress
    completedScenarios: [
      {
        scenarioId: String,
        completedAt: Date,
        score: Number,
        rank: Number,
      },
    ],

    // Achievements
    achievements: [achievementSchema],

    // Trading stats (denormalized for quick display)
    totalTrades: { type: Number, default: 0 },
    winningTrades: { type: Number, default: 0 },
    totalProfitLoss: { type: Number, default: 0 },
    bestTrade: {
      symbol: String,
      profit: Number,
      date: Date,
    },
    worstTrade: {
      symbol: String,
      loss: Number,
      date: Date,
    },
  },
  { timestamps: true }
);

// Virtual: win rate
userProgressSchema.virtual("winRate").get(function () {
  if (this.totalTrades === 0) return 0;
  return ((this.winningTrades / this.totalTrades) * 100).toFixed(1);
});

// Virtual: rank title based on level
userProgressSchema.virtual("rankTitle").get(function () {
  if (this.level >= 50) return "Market Wizard";
  if (this.level >= 30) return "Senior Trader";
  if (this.level >= 20) return "Analyst";
  if (this.level >= 10) return "Junior Trader";
  if (this.level >= 5) return "Apprentice";
  return "Rookie";
});

// Add XP and handle level-up
userProgressSchema.methods.addXP = async function (amount) {
  this.xp += amount;
  while (this.xp >= this.xpToNextLevel) {
    this.xp -= this.xpToNextLevel;
    this.level += 1;
    this.xpToNextLevel = Math.floor(500 * Math.pow(1.15, this.level));
  }
  return this.save();
};

userProgressSchema.set("toJSON", { virtuals: true });
userProgressSchema.set("toObject", { virtuals: true });

export default mongoose.model("UserProgress", userProgressSchema);

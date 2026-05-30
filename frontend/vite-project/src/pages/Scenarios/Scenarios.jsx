import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api.js";
import styles from "./Scenarios.module.css";

const SCENARIOS = [
  {
    id: "bull_market",
    name: "Bull Market Rally",
    tagline: "Ride the wave — or get left behind",
    description:
      "Markets are ripping higher. Every dip gets bought. Easy money — until it isn't. Learn momentum trading before real markets test you.",
    difficulty: "beginner",
    duration: 180,
    reward: 500,
    icon: "📈",
    color: "#22c55e",
    tags: ["Momentum", "Trend Following", "Entry Timing"],
    players: 2847,
    completionRate: 72,
    psychBadge: "CONFIDENCE BUILDER",
    isCompetitive: false,
    isLive: false,
  },
  {
    id: "bear_crash",
    name: "Bear Market Crash",
    tagline: "Can you survive when everyone panics?",
    description:
      "Everything is falling. Portfolios bleeding. Most traders freeze — the best ones thrive. Prove you have the discipline to protect capital when fear takes over.",
    difficulty: "intermediate",
    duration: 180,
    reward: 1200,
    icon: "📉",
    color: "#ef4444",
    tags: ["Risk Management", "Stop-Loss", "Capital Preservation"],
    players: 1923,
    completionRate: 41,
    psychBadge: "FEAR RESISTANCE",
    isCompetitive: false,
    isLive: false,
  },
  {
    id: "recession",
    name: "Recession Mode",
    tagline: "Slow bleed. No crash. Just patience.",
    description:
      "No dramatic collapse — just slow grinding erosion. The real test: staying rational when everything looks cheap but keeps getting cheaper.",
    difficulty: "advanced",
    duration: 240,
    reward: 2000,
    icon: "🌩️",
    color: "#f59e0b",
    tags: ["Sector Rotation", "Macro", "Defensive Plays"],
    players: 876,
    completionRate: 28,
    psychBadge: "DISCIPLINE MASTERY",
    isCompetitive: false,
    isLive: false,
  },
  {
    id: "news_reaction",
    name: "Breaking News Reactor",
    tagline: "30 seconds. Make your call. Don't hesitate.",
    description:
      "BREAKING NEWS floods your screen every 30 seconds. React correctly or watch your portfolio collapse. Emotion is your enemy. Clarity is your edge.",
    difficulty: "intermediate",
    duration: 150,
    reward: 1500,
    icon: "⚡",
    color: "#8b5cf6",
    tags: ["News Trading", "Speed", "Emotional Control"],
    players: 3102,
    completionRate: 55,
    psychBadge: "COLD-BLOODED TRADER",
    isCompetitive: false,
    isLive: false,
  },
  {
    id: "intraday",
    name: "Intraday Blitz",
    tagline: "15 minutes. ₹1L. Live leaderboard. Go.",
    description:
      "Compete against real players right now. Same starting capital, same market, same clock. One leaderboard. Are you in the top 10%?",
    difficulty: "expert",
    duration: 900,
    reward: 5000,
    icon: "⏱️",
    color: "#06b6d4",
    tags: ["Competitive", "Speed", "Intraday"],
    players: 8441,
    completionRate: 19,
    psychBadge: "ELITE COMPETITOR",
    isCompetitive: true,
    isLive: true,
  },
];

const DIFF_LABELS = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
};
const DIFF_COLORS = {
  beginner: "green",
  intermediate: "amber",
  advanced: "red",
  expert: "violet",
};
const DIFF_ORDER = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };

function DiffPill({ d }) {
  return (
    <span className={`${styles.diffPill} ${styles[DIFF_COLORS[d]]}`}>
      {DIFF_LABELS[d]}
    </span>
  );
}

export default function Scenarios() {
  const [progress, setProgress] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/scenarios/progress")
      .then(({ data }) => setProgress(data.progress))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const completedIds = new Set(
    progress?.completedScenarios?.map((s) => s.scenarioId) ?? []
  );
  const best = (id) =>
    progress?.completedScenarios?.find((s) => s.scenarioId === id)?.score ??
    null;
  const xpPct = progress
    ? Math.min(100, (progress.xp / progress.xpToNextLevel) * 100)
    : 0;

  const rankTitle = (() => {
    if (!progress) return "Rookie";
    const l = progress.level;
    if (l >= 50) return "Market Wizard";
    if (l >= 30) return "Senior Trader";
    if (l >= 20) return "Analyst";
    if (l >= 10) return "Junior Trader";
    if (l >= 5) return "Apprentice";
    return "Rookie";
  })();

  const active = SCENARIOS.find((s) => s.id === selected);

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroText}>
          <div className={styles.eyebrow}>SIMULATION ENGINE</div>
          <h1 className={styles.heroTitle}>Market Battlefield</h1>
          <p className={styles.heroSub}>
            Each scenario puts you under real market pressure — before real
            money is at risk. Complete scenarios, earn XP, climb the ranks.
          </p>
        </div>
        {!loading && progress && (
          <div className={styles.progressCard}>
            <div className={styles.rankRow}>
              <div className={styles.rankBadge}>{progress.level}</div>
              <div>
                <div className={styles.rankTitle}>{rankTitle}</div>
                <div className={styles.rankSub}>
                  Level {progress.level} · {progress.currentStreak ?? 0} day
                  streak 🔥
                </div>
              </div>
              <div className={styles.xpNum}>{progress.xp} XP</div>
            </div>
            <div className={styles.xpTrack}>
              <div className={styles.xpFill} style={{ width: `${xpPct}%` }} />
            </div>
            <div className={styles.xpMeta}>
              {progress.xpToNextLevel - progress.xp} XP to next level
            </div>
            <div className={styles.progressStats}>
              <div className={styles.pStat}>
                <div className={styles.pVal}>{completedIds.size}</div>
                <div className={styles.pLbl}>Completed</div>
              </div>
              <div className={styles.pStat}>
                <div className={styles.pVal}>
                  {progress.achievements?.length ?? 0}
                </div>
                <div className={styles.pLbl}>Achievements</div>
              </div>
              <div className={styles.pStat}>
                <div className={styles.pVal}>
                  {SCENARIOS.length - completedIds.size}
                </div>
                <div className={styles.pLbl}>Remaining</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.body}>
        {/* Card list */}
        <div className={styles.cardList}>
          {SCENARIOS.map((s) => {
            const done = completedIds.has(s.id);
            const score = best(s.id);
            const isSel = selected === s.id;
            return (
              <div
                key={s.id}
                className={`${styles.scCard} ${
                  isSel ? styles.scSelected : ""
                } ${done ? styles.scDone : ""}`}
                style={{ "--col": s.color }}
                onClick={() => setSelected(isSel ? null : s.id)}
              >
                <div className={styles.scTop}>
                  <span className={styles.scIcon}>{s.icon}</span>
                  <div className={styles.scTopRight}>
                    <DiffPill d={s.difficulty} />
                    {done && <span className={styles.doneBadge}>✓ Done</span>}
                    {s.isLive && (
                      <span className={styles.liveBadge}>● LIVE</span>
                    )}
                  </div>
                </div>
                <div className={styles.scPsych}>{s.psychBadge}</div>
                <div className={styles.scName}>{s.name}</div>
                <div className={styles.scTagline}>{s.tagline}</div>
                <div className={styles.scMeta}>
                  <span className={styles.scMetaItem}>
                    ⏱{" "}
                    {s.duration < 120
                      ? `${s.duration}s`
                      : `${Math.round(s.duration / 60)}m`}
                  </span>
                  <span className={styles.scMetaItem}>
                    👥 {s.players.toLocaleString()}
                  </span>
                  <span className={styles.scMetaItem}>
                    📊 {s.completionRate}% finish
                  </span>
                </div>
                <div className={styles.scBottom}>
                  <div className={styles.scReward}>+{s.reward} XP</div>
                  {score !== null && (
                    <div className={styles.scScore}>Best: {score} pts</div>
                  )}
                </div>
                <div className={styles.diffBar}>
                  <div
                    className={styles.diffFill}
                    style={{
                      width: `${DIFF_ORDER[s.difficulty] * 25}%`,
                      background: s.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail */}
        <div className={styles.detail}>
          {active ? (
            <div
              className={styles.detailCard}
              style={{ "--col": active.color }}
            >
              <div className={styles.detailIcon}>{active.icon}</div>
              <div className={styles.detailBadge}>{active.psychBadge}</div>
              <h2 className={styles.detailName}>{active.name}</h2>
              <p className={styles.detailDesc}>{active.description}</p>
              <div className={styles.detailStats}>
                <div className={styles.dStat}>
                  <div className={styles.dLbl}>Duration</div>
                  <div className={styles.dVal}>
                    {active.duration < 120
                      ? `${active.duration}s`
                      : `${Math.round(active.duration / 60)} min`}
                  </div>
                </div>
                <div className={styles.dStat}>
                  <div className={styles.dLbl}>Difficulty</div>
                  <div className={styles.dVal}>
                    <DiffPill d={active.difficulty} />
                  </div>
                </div>
                <div className={styles.dStat}>
                  <div className={styles.dLbl}>XP Reward</div>
                  <div className={styles.dVal} style={{ color: active.color }}>
                    +{active.reward}
                  </div>
                </div>
                <div className={styles.dStat}>
                  <div className={styles.dLbl}>Completion Rate</div>
                  <div className={styles.dVal}>{active.completionRate}%</div>
                </div>
                <div className={styles.dStat}>
                  <div className={styles.dLbl}>Format</div>
                  <div className={styles.dVal}>
                    {active.isCompetitive ? "Competitive" : "Solo"}
                  </div>
                </div>
                {best(active.id) !== null && (
                  <div className={styles.dStat}>
                    <div className={styles.dLbl}>Your Best</div>
                    <div
                      className={styles.dVal}
                      style={{ color: active.color }}
                    >
                      {best(active.id)} pts
                    </div>
                  </div>
                )}
              </div>
              <div className={styles.tagList}>
                {active.tags.map((t) => (
                  <span key={t} className={styles.tag}>
                    {t}
                  </span>
                ))}
              </div>
              <div className={styles.socialProof}>
                <span className={styles.spIcon}>👥</span>
                <span className={styles.spText}>
                  <strong>{active.players.toLocaleString()}</strong> traders
                  attempted this — only{" "}
                  <strong>{active.completionRate}%</strong> finished.
                </span>
              </div>
              <button
                className={styles.launchBtn}
                style={{ background: active.color }}
                onClick={() => navigate(`/scenarios/${active.id}`)}
              >
                {completedIds.has(active.id)
                  ? "▶  Play Again"
                  : "▶  Start Scenario"}
              </button>
              {active.isCompetitive && (
                <div className={styles.compNote}>
                  🏆 Live leaderboard — your score ranks against all players.
                </div>
              )}
            </div>
          ) : (
            <div className={styles.detailEmpty}>
              <div className={styles.emptyGlyph}>🎯</div>
              <div className={styles.emptyTitle}>Choose a scenario</div>
              <div className={styles.emptySub}>
                Select any scenario from the list to see details and launch
              </div>
              <div className={styles.achievements}>
                <div className={styles.achTitle}>Achievements to unlock</div>
                {[
                  {
                    icon: "🥇",
                    name: "First Blood",
                    desc: "Complete your first trade",
                  },
                  {
                    icon: "🐻",
                    name: "Bear Survivor",
                    desc: "Survive the Bear Crash",
                  },
                  {
                    icon: "⚡",
                    name: "News Hawk",
                    desc: "React correctly to 4 news events",
                  },
                  {
                    icon: "🏆",
                    name: "Speed Demon",
                    desc: "Complete Intraday Blitz",
                  },
                ].map((a) => (
                  <div key={a.name} className={styles.achItem}>
                    <span className={styles.achIcon}>{a.icon}</span>
                    <div>
                      <div className={styles.achName}>{a.name}</div>
                      <div className={styles.achDesc}>{a.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

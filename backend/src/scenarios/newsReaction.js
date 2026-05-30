/**
 * newsReaction.js
 * Timer-based news events. React fast. Think clearly under pressure.
 * The most emotionally intense scenario — mimics real trading adrenaline.
 */

export const newsReactionScenario = {
  id: "news_reaction",
  name: "Breaking News Reaction",
  description:
    "BREAKING NEWS floods your screen. Prices react in seconds. You have 30 seconds per event to decide: buy, sell, or hold. Emotion is your enemy. Clarity is your edge.",
  difficulty: "intermediate",
  duration: 150,
  volatility: 0.6,
  marketTrend: 0, // neutral — pure event-driven
  startingCash: 100000,
  scoringMetric: "reaction_accuracy", // did you trade in the right direction?
  tags: ["news trading", "reaction time", "emotional control"],
  uiMode: "breaking_news", // triggers red-flash UI
  events: [
    {
      time: 10,
      title: "⚡ BREAKING: RBI Emergency Rate Hike",
      description:
        "RBI hikes repo rate by 50bps in emergency meeting. Markets blindsided.",
      impact: -8,
      sector: "banking",
      decisionWindow: 30, // seconds to react
      hint: "Rate hikes hurt banks (higher borrowing costs) but may signal RBI confidence in growth",
    },
    {
      time: 45,
      title: "🔥 BREAKING: Major IT Company Earnings Beat",
      description:
        "TCS Q3 results: Revenue +22% YoY, margin expands 150bps. Guidance raised.",
      impact: 12,
      sector: "it",
      decisionWindow: 30,
      hint: "Strong results + raised guidance = sustained rally likely. Buy the initial dip if any",
    },
    {
      time: 75,
      title: "💣 BREAKING: India-China Border Tensions Escalate",
      description:
        "Reports of border standoff. Defence ministry calls emergency meeting.",
      impact: -6,
      sector: "all",
      decisionWindow: 25,
      hint: "Geopolitical fear = defensive flight. Defence stocks may rally while markets fall",
    },
    {
      time: 100,
      title: "🏆 BREAKING: India Wins Major Trade Deal",
      description:
        "India-EU FTA signed. ₹5L Cr in projected annual trade boost.",
      impact: 9,
      sector: "export",
      decisionWindow: 30,
      hint: "Export-oriented sectors: IT, pharma, textiles will benefit most",
    },
    {
      time: 128,
      title: "💀 BREAKING: SEBI Bans Top Promoter for Fraud",
      description:
        "Leading conglomerate's promoter banned. Stock circuit down. Panic selling spreads.",
      impact: -20,
      sector: "specific",
      decisionWindow: 20,
      hint: "Sell first, ask questions later. Governance risk is unquantifiable",
    },
  ],
  learningObjectives: [
    "Process news quality before price direction",
    "Distinguish sector-specific vs market-wide events",
    "Set decision timeboxes — hesitation is a decision too",
    "Emotional neutrality: good news ≠ always buy",
  ],
};

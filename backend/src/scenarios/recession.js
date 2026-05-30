/**
 * recession.js
 * Slow, grinding downturn with volatile swings and defensive sector rotation.
 * Teaches: sector rotation, hedging, patience.
 */

export const recessionScenario = {
  id: "recession",
  name: "Recession Mode",
  description:
    "Slow bleed. No dramatic crash — just endless erosion. Inflation bites, rates climb, growth stalls. The real test: staying rational when everything looks cheap but keeps getting cheaper.",
  difficulty: "advanced",
  duration: 240,
  volatility: 0.5,
  marketTrend: -0.35,
  startingCash: 100000,
  scoringMetric: "relative_performance", // beat the index
  tags: ["sector rotation", "defensive plays", "macro"],
  events: [
    {
      time: 20,
      title: "📊 CPI Data: Inflation at 8.2%",
      description: "Persistently high inflation forces RBI's hand.",
      impact: -4,
      sector: "all",
    },
    {
      time: 40,
      title: "🛡️ FMCG Sector Holds",
      description:
        "Consumer staples prove resilient as investors flee to safety.",
      impact: 5,
      sector: "fmcg",
    },
    {
      time: 65,
      title: "🏗️ Infrastructure Collapse",
      description:
        "Capital goods orders fall 30%. Construction activity stalls.",
      impact: -9,
      sector: "infra",
    },
    {
      time: 100,
      title: "⚡ Power Sector Surge",
      description: "Govt announces ₹2L Cr energy infrastructure push.",
      impact: 8,
      sector: "power",
    },
    {
      time: 130,
      title: "🏦 Bank NPAs Rising",
      description: "GNPA ratio climbs to 5.4%. Credit growth slows.",
      impact: -7,
      sector: "banking",
    },
    {
      time: 170,
      title: "💊 Healthcare Outperforms",
      description: "Recession-proof sector: people don't stop getting sick.",
      impact: 6,
      sector: "healthcare",
    },
    {
      time: 210,
      title: "🌍 IMF Downgrades India",
      description:
        "India GDP forecast cut to 5.1%. Sentiment hits multi-year low.",
      impact: -10,
      sector: "all",
    },
  ],
  learningObjectives: [
    "Rotate into defensive sectors: FMCG, healthcare, power",
    "Avoid value traps — cheap stocks keep getting cheaper",
    "Monitor macro indicators before each trade",
    "Beat the index, not just make absolute profit",
  ],
};

import styles from "./StatCards.module.css";

/**
 * StatCards — 6-card summary row for the Dashboard top section.
 * Drop-in replacement/addition above the existing PortfolioChart.
 *
 * Props:
 *   orders   — array of Order objects from /api/trade/orders
 *   balance  — current cash balance (number)
 *   prices   — live prices array from usePrices()
 *   holdings — portfolio holdings array from /api/portfolio
 */
export default function StatCards({
  orders = [],
  balance = 0,
  prices = [],
  holdings = [],
}) {
  // ── Compute stats from orders ────────────────────────────────────────────
  const sells = orders.filter((o) => o.type === "sell");
  const buys = orders.filter((o) => o.type === "buy");

  // P&L per sell: compare sell price vs earliest matching buy price
  const buyPriceMap = {};
  buys.forEach((b) => {
    if (!buyPriceMap[b.stock]) buyPriceMap[b.stock] = [];
    buyPriceMap[b.stock].push(b.price);
  });

  let totalPnL = 0,
    wins = 0,
    losses = 0;
  let bestTrade = null,
    worstTrade = null;

  sells.forEach((s) => {
    const buyHistory = buyPriceMap[s.stock];
    const buyPrice = buyHistory?.shift() ?? s.price;
    const pnl = (s.price - buyPrice) * s.quantity;
    totalPnL += pnl;

    if (pnl > 0) {
      wins++;
      if (!bestTrade || pnl > bestTrade.pnl)
        bestTrade = { symbol: s.stock, pnl, price: s.price };
    } else {
      losses++;
      if (!worstTrade || pnl < worstTrade.pnl)
        worstTrade = { symbol: s.stock, pnl, price: s.price };
    }
  });

  const winRate =
    sells.length > 0 ? ((wins / sells.length) * 100).toFixed(0) : null;

  // Today's trades
  const today = new Date().toDateString();
  const todayOrders = orders.filter(
    (o) => new Date(o.createdAt).toDateString() === today
  );
  const todaySells = todayOrders.filter((o) => o.type === "sell");
  let dailyPnL = 0;
  todaySells.forEach((s) => {
    const buyHistory = buyPriceMap[s.stock];
    const buyPrice = buyHistory?.shift() ?? s.price;
    dailyPnL += (s.price - buyPrice) * s.quantity;
  });

  // Portfolio value
  const portfolioValue = holdings.reduce((sum, h) => {
    const live = prices.find((p) => p.symbol === h.stock);
    return sum + (live?.price ?? 0) * h.quantity;
  }, 0);
  const totalAssets = balance + portfolioValue;

  // ── Card data ────────────────────────────────────────────────────────────
  const cards = [
    {
      id: "assets",
      eyebrow: "TOTAL ASSETS",
      value: `₹${Math.round(totalAssets).toLocaleString("en-IN")}`,
      sub: "Cash + Portfolio",
      accent: "indigo",
      icon: "◈",
    },
    {
      id: "cash",
      eyebrow: "CASH BALANCE",
      value: `₹${Math.round(balance).toLocaleString("en-IN")}`,
      sub: "Available to trade",
      accent: "green",
      icon: "₹",
    },
    {
      id: "pnl",
      eyebrow: "TOTAL P&L",
      value: `${totalPnL >= 0 ? "+" : ""}₹${Math.abs(
        Math.round(totalPnL)
      ).toLocaleString("en-IN")}`,
      sub: `${sells.length} closed trade${sells.length !== 1 ? "s" : ""}`,
      accent: totalPnL >= 0 ? "green" : "red",
      icon: totalPnL >= 0 ? "▲" : "▼",
      valueColor: totalPnL >= 0 ? "green" : "red",
    },
    {
      id: "daily",
      eyebrow: "TODAY'S P&L",
      value:
        todaySells.length > 0
          ? `${dailyPnL >= 0 ? "+" : ""}₹${Math.abs(
              Math.round(dailyPnL)
            ).toLocaleString("en-IN")}`
          : "—",
      sub: `${todayOrders.length} order${
        todayOrders.length !== 1 ? "s" : ""
      } today`,
      accent: dailyPnL >= 0 ? "green" : dailyPnL < 0 ? "red" : "muted",
      icon: "⏱",
      valueColor: dailyPnL > 0 ? "green" : dailyPnL < 0 ? "red" : undefined,
    },
    {
      id: "winrate",
      eyebrow: "WIN RATE",
      value: winRate !== null ? `${winRate}%` : "—",
      sub: `${wins}W / ${losses}L`,
      accent: winRate >= 60 ? "green" : winRate >= 40 ? "amber" : "red",
      icon: "🎯",
      valueColor:
        winRate >= 60
          ? "green"
          : winRate >= 40
          ? "amber"
          : winRate !== null
          ? "red"
          : undefined,
    },
    {
      id: "best",
      eyebrow: "BEST TRADE",
      value: bestTrade
        ? `+₹${Math.round(bestTrade.pnl).toLocaleString("en-IN")}`
        : "—",
      sub: bestTrade ? bestTrade.symbol : "No profitable trades yet",
      accent: "green",
      icon: "🏆",
      valueColor: "green",
    },
  ];

  return (
    <div className={styles.grid}>
      {cards.map((c) => (
        <div
          key={c.id}
          className={`${styles.card} ${styles[`accent_${c.accent}`]}`}
        >
          <div className={styles.cardTop}>
            <span className={styles.eyebrow}>{c.eyebrow}</span>
            <span className={styles.icon}>{c.icon}</span>
          </div>
          <div
            className={`${styles.value} ${
              c.valueColor ? styles[c.valueColor] : ""
            }`}
          >
            {c.value}
          </div>
          <div className={styles.sub}>{c.sub}</div>
        </div>
      ))}
    </div>
  );
}

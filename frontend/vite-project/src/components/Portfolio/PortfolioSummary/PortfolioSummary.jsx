import styles from "./Portfolio.module.css";

function Card({ eyebrow, value, sub, pill, accentClass, valueClass }) {
  return (
    <div className={`${styles.card} ${accentClass}`}>
      <div className={styles.eyebrow}>{eyebrow}</div>
      <div className={`${styles.value} ${valueClass}`}>{value}</div>
      {sub && <div className={styles.sub}>{sub}</div>}
      {pill && (
        <div
          className={`${styles.pill} ${
            pill.up ? styles.pillGreen : styles.pillRed
          }`}
        >
          {pill.up ? "▲" : "▼"} {pill.text}
        </div>
      )}
    </div>
  );
}

export default function PortfolioSummary({
  balance,
  totalValue,
  totalInvested,
  holdingsCount,
}) {
  const pnl = totalValue - totalInvested;
  const pnlPct =
    totalInvested > 0 ? ((pnl / totalInvested) * 100).toFixed(2) : "0.00";
  const pnlUp = pnl >= 0;

  const totalAssets = balance + totalValue;

  return (
    <div className={styles.grid}>
      <Card
        eyebrow="CASH BALANCE"
        value={`₹${Number(balance).toLocaleString("en-IN")}`}
        sub="Available to trade"
        accentClass={styles.accentGreen}
        valueClass={styles.green}
      />
      <Card
        eyebrow="PORTFOLIO VALUE"
        value={`₹${totalValue.toLocaleString("en-IN", {
          maximumFractionDigits: 0,
        })}`}
        sub={`${holdingsCount} stock${holdingsCount !== 1 ? "s" : ""} held`}
        accentClass={styles.accentAmber}
        valueClass={styles.amber}
      />
      <Card
        eyebrow="TOTAL ASSETS"
        value={`₹${totalAssets.toLocaleString("en-IN", {
          maximumFractionDigits: 0,
        })}`}
        sub="Cash + Portfolio"
        accentClass={styles.accentIndigo}
        valueClass={styles.indigo}
      />
      <Card
        eyebrow="UNREALISED P&L"
        value={`${pnlUp ? "+" : ""}₹${Math.abs(pnl).toLocaleString("en-IN", {
          maximumFractionDigits: 0,
        })}`}
        sub={
          totalInvested > 0 ? `Based on avg buy price` : "No invested cost data"
        }
        pill={
          totalInvested > 0
            ? { up: pnlUp, text: `${pnlUp ? "+" : ""}${pnlPct}%` }
            : null
        }
        accentClass={pnlUp ? styles.accentGreen : styles.accentRed}
        valueClass={pnlUp ? styles.green : styles.red}
      />
    </div>
  );
}

import styles from "./StockCard.module.css";

const LOGO_COLORS = [
  "#6366f1",
  "#e53935",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#3b82f6",
  "#84cc16",
  "#ec4899",
  "#14b8a6",
  "#f43f5e",
  "#a855f7",
  "#eab308",
  "#22c55e",
  "#0ea5e9",
  "#d946ef",
  "#f97316",
  "#10b981",
  "#6366f1",
];

function Sparkline({ up }) {
  const pts = up
    ? "0,18 8,13 16,15 24,8 32,11 40,4 48,7 56,1"
    : "0,1 8,5 16,3 24,9 32,7 40,13 48,11 56,18";
  return (
    <svg width="56" height="20" viewBox="0 0 56 20" fill="none">
      <polyline
        points={pts}
        stroke={up ? "#00d68f" : "#ff4757"}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StockCardSkeleton() {
  return <div className={styles.skeleton} />;
}

export default function StockCard({ stock, colorIndex = 0 }) {
  const up = (stock.change ?? 0) >= 0;
  const color = LOGO_COLORS[colorIndex % LOGO_COLORS.length];

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.logoWrap}>
          <div
            className={styles.logo}
            style={{
              background: `linear-gradient(135deg,${color},${color}88)`,
            }}
          >
            {stock.symbol.slice(0, 2)}
          </div>
          <div className={styles.info}>
            <div className={styles.symbol}>{stock.symbol}</div>
            <div className={styles.name}>
              {stock.name?.split(" ").slice(0, 2).join(" ")}
            </div>
          </div>
        </div>
        <Sparkline up={up} />
      </div>

      <div className={styles.price}>
        ₹
        {(stock.price ?? 0).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </div>

      <div className={`${styles.change} ${up ? styles.up : styles.down}`}>
        <span>{up ? "▲" : "▼"}</span>
        <span>{Math.abs(stock.change ?? 0).toFixed(2)}</span>
        <span className={styles.dot}>·</span>
        <span>
          {up ? "+" : ""}
          {(stock.percentChange ?? 0).toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

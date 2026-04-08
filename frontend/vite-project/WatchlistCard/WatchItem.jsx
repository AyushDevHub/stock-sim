import styles from "./WatchlistCard.module.css";

const COLORS = [
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
];

export default function WatchItem({
  symbol,
  stock,
  colorIdx,
  onRemove,
  onNavigate,
}) {
  const safeSymbol = typeof symbol === "string" ? symbol : "--";
  const up = (stock?.change ?? 0) >= 0;

  return (
    <div className={styles.item} onClick={() => onNavigate(symbol)}>
      <div className={styles.itemLeft}>
        <div
          className={styles.logo}
          style={{ "--logo-color": COLORS[colorIdx % COLORS.length] }}
        >
          {safeSymbol.slice(0, 2)}
        </div>

        <div>
          <div className={styles.symbol}>{safeSymbol}</div>
          <div className={styles.name}>
            {stock?.name?.split(" ").slice(0, 2).join(" ") || "Unknown"}
          </div>
        </div>
      </div>

      <div className={styles.itemRight}>
        <div className={styles.priceBlock}>
          <div className={styles.price}>
            {stock
              ? `₹${(stock.price ?? 0).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              : "—"}
          </div>

          {stock && (
            <div className={`${styles.change} ${up ? styles.up : styles.down}`}>
              {up ? "▲" : "▼"} {up ? "+" : ""}
              {(stock.percentChange ?? 0).toFixed(2)}%
            </div>
          )}
        </div>

        <button
          className={styles.removeBtn}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(symbol);
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

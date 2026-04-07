import { useNavigate } from "react-router-dom";
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
];

export default function WatchlistCard({ stocks = [], loading }) {
  const navigate = useNavigate();

  // show top 8 by absolute percent change
  const watchlist = [...stocks]
    .sort(
      (a, b) => Math.abs(b.percentChange ?? 0) - Math.abs(a.percentChange ?? 0)
    )
    .slice(0, 8);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.title}>Watchlist</div>
        <button className={styles.addBtn}>Add New</button>
      </div>

      <div className={styles.list}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={styles.skeleton}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))
          : watchlist.map((s, i) => {
              const up = (s.change ?? 0) >= 0;
              return (
                <div
                  key={s.symbol}
                  className={styles.item}
                  onClick={() => navigate(`/chart?symbol=${s.symbol}`)}
                >
                  <div className={styles.itemLeft}>
                    <div
                      className={styles.logo}
                      style={{
                        background: `linear-gradient(135deg,${
                          COLORS[i % COLORS.length]
                        },${COLORS[i % COLORS.length]}88)`,
                      }}
                    >
                      {s.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className={styles.symbol}>{s.symbol}</div>
                      <div className={styles.name}>
                        {s.name?.split(" ").slice(0, 2).join(" ")}
                      </div>
                    </div>
                  </div>
                  <div className={styles.itemRight}>
                    <div className={styles.price}>
                      ₹
                      {(s.price ?? 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <div
                      className={`${styles.change} ${
                        up ? styles.up : styles.down
                      }`}
                    >
                      {up ? "▲" : "▼"} {up ? "+" : ""}
                      {(s.percentChange ?? 0).toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}

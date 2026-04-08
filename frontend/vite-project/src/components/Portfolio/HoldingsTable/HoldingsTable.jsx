import { useNavigate } from "react-router-dom";
import styles from "./HoldingsTable.module.css";

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

function SkeletonRows() {
  return Array.from({ length: 4 }).map((_, i) => (
    <tr key={i}>
      <td colSpan={6}>
        <div
          className={styles.skelRow}
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <div className={styles.skelCircle} />
          <div className={styles.skelBar} style={{ width: 70 }} />
          <div className={styles.skelBar} style={{ width: 120 }} />
          <div
            className={styles.skelBar}
            style={{ width: 60, marginLeft: "auto" }}
          />
          <div className={styles.skelBar} style={{ width: 80 }} />
        </div>
      </td>
    </tr>
  ));
}

export default function HoldingsTable({ holdings, loading }) {
  const navigate = useNavigate();

  return (
    <div className={styles.wrap}>
      <div className={styles.scrollX}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th className={styles.thLeft}>STOCK</th>
              <th className={styles.thRight}>QTY</th>
              <th className={styles.thRight}>CURRENT PRICE</th>
              <th className={styles.thRight}>DAY CHANGE</th>
              <th className={styles.thRight}>MARKET VALUE</th>
              <th className={styles.thRight}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows />
            ) : holdings.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className={styles.empty}>
                    <div className={styles.emptyIcon}>📭</div>
                    <div className={styles.emptyTitle}>No holdings yet</div>
                    <div className={styles.emptyText}>
                      You haven't bought any stocks. Start trading to build your
                      portfolio.
                    </div>
                    <button
                      className={styles.emptyBtn}
                      onClick={() => navigate("/trade")}
                    >
                      START TRADING →
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              holdings.map((h, i) => {
                const up = (h.dayChange ?? 0) >= 0;
                return (
                  <tr
                    key={h.stock}
                    className={styles.trow}
                    onClick={() => navigate(`/chart?symbol=${h.stock}`)}
                  >
                    <td className={styles.tdStock}>
                      <div className={styles.stockRow}>
                        <div
                          className={styles.logo}
                          style={{
                            background: `linear-gradient(135deg,${
                              COLORS[i % COLORS.length]
                            },${COLORS[i % COLORS.length]}88)`,
                          }}
                        >
                          {h.stock.slice(0, 2)}
                        </div>
                        <div>
                          <div className={styles.stockSymbol}>{h.stock}</div>
                          <div className={styles.stockName}>{h.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className={styles.tdNum}>{h.quantity}</td>
                    <td className={styles.tdNum}>
                      ₹
                      {h.currentPrice.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className={styles.tdChange}>
                      <span
                        className={`${styles.changePill} ${
                          h.dayChange == null
                            ? styles.flatPill
                            : up
                            ? styles.upPill
                            : styles.downPill
                        }`}
                      >
                        {h.dayChange != null ? (up ? "▲" : "▼") : "—"}
                        {h.dayChange != null
                          ? ` ${up ? "+" : ""}${(h.dayChangePct ?? 0).toFixed(
                              2
                            )}%`
                          : ""}
                      </span>
                    </td>
                    <td className={styles.tdValue}>
                      ₹
                      {h.value.toLocaleString("en-IN", {
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td className={styles.tdAction}>
                      <div className={styles.actionBtns}>
                        <button
                          className={styles.btnChart}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/chart?symbol=${h.stock}`);
                          }}
                        >
                          CHART
                        </button>
                        <button
                          className={styles.btnTrade}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate("/trade");
                          }}
                        >
                          TRADE
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

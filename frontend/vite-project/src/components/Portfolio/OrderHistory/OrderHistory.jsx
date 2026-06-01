import { useState } from "react";
import styles from "./OrderHistory.module.css";

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
const PAGE_SIZE = 10;

const STATUS_STYLE = {
  EXECUTED: { color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
  OPEN: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  PENDING: { color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
  CANCELLED: { color: "#5a7080", bg: "rgba(90,112,128,0.1)" },
  REJECTED: { color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  EXPIRED: { color: "#5a7080", bg: "rgba(90,112,128,0.1)" },
};

function SkeletonRows() {
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i}>
      <td colSpan={8}>
        <div
          className={styles.skelRow}
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          {[70, 50, 80, 60, 60, 90, 50, 80].map((w, j) => (
            <div key={j} className={styles.skelBar} style={{ width: w }} />
          ))}
        </div>
      </td>
    </tr>
  ));
}

const fmt = (n) =>
  n == null
    ? "—"
    : "₹" +
      Number(n).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

export default function OrderHistory({ orders, loading }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(orders.length / PAGE_SIZE);
  const paged = orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const symbolColorMap = {};
  orders.forEach((o) => {
    if (!symbolColorMap[o.stock])
      symbolColorMap[o.stock] = Object.keys(symbolColorMap).length;
  });

  return (
    <div className={styles.wrap}>
      <div className={styles.scrollX}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th className={styles.thLeft}>DATE</th>
              <th className={styles.thLeft}>STOCK</th>
              <th className={styles.thRight}>SIDE</th>
              <th className={styles.thRight}>ORDER TYPE</th>
              <th className={styles.thRight}>STATUS</th>
              <th className={styles.thRight}>QTY</th>
              <th className={styles.thRight}>PRICE</th>
              <th className={styles.thRight}>CHARGES</th>
              <th className={styles.thRight}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows />
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className={styles.empty}>
                    <div className={styles.emptyIcon}>📋</div>
                    <div className={styles.emptyTitle}>No orders yet</div>
                    <div className={styles.emptyText}>
                      Your trade history will appear here after your first buy
                      or sell.
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              paged.map((o) => {
                const colorIdx = symbolColorMap[o.stock] ?? 0;
                const st = STATUS_STYLE[o.status] ?? STATUS_STYLE.EXECUTED;
                const orderLabel = (o.orderType || "MARKET").replace(/_/g, " ");
                return (
                  <tr key={o._id || o.id} className={styles.trow}>
                    <td className={styles.tdDate}>
                      {new Date(o.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className={styles.tdStock}>
                      <div className={styles.stockRow}>
                        <div
                          className={styles.logo}
                          style={{
                            background: `linear-gradient(135deg,${
                              COLORS[colorIdx % COLORS.length]
                            },${COLORS[colorIdx % COLORS.length]}88)`,
                          }}
                        >
                          {o.stock.slice(0, 2)}
                        </div>
                        <div className={styles.stockSymbol}>{o.stock}</div>
                      </div>
                    </td>
                    <td className={styles.tdType}>
                      <span
                        className={`${styles.typePill} ${
                          o.type === "buy" ? styles.buyPill : styles.sellPill
                        }`}
                      >
                        {o.type?.toUpperCase()}
                      </span>
                    </td>
                    <td
                      className={styles.tdMono}
                      style={{ fontSize: "0.62rem", letterSpacing: "0.04em" }}
                    >
                      {orderLabel}
                    </td>
                    <td className={styles.tdNum}>
                      <span
                        className={styles.statusPill}
                        style={{ color: st.color, background: st.bg }}
                      >
                        {o.status || "EXECUTED"}
                      </span>
                    </td>
                    <td className={styles.tdNum}>{o.quantity}</td>
                    <td className={styles.tdNum}>
                      {o.price != null ? fmt(o.price) : "OPEN"}
                    </td>
                    <td
                      className={styles.tdNum}
                      style={{ color: "#f59e0b", fontSize: "0.7rem" }}
                    >
                      {o.brokerage != null
                        ? fmt(
                            typeof o.brokerage === "object"
                              ? o.brokerage.total
                              : o.brokerage
                          )
                        : "—"}
                    </td>
                    <td className={styles.tdTotal}>
                      {o.total != null ? fmt(o.total) : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && totalPages > 1 && (
        <div className={styles.pagination}>
          <div className={styles.pageInfo}>
            {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, orders.length)} of {orders.length}{" "}
            orders
          </div>
          <div className={styles.pageBtns}>
            <button
              className={`${styles.pageBtn} ${
                page === 1 ? styles.pageBtnDisabled : ""
              }`}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ‹
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
              <button
                key={i + 1}
                className={`${styles.pageBtn} ${
                  page === i + 1 ? styles.pageBtnActive : ""
                }`}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            {totalPages > 5 && (
              <span
                className={styles.pageBtn}
                style={{ cursor: "default", border: "none" }}
              >
                …
              </span>
            )}
            <button
              className={`${styles.pageBtn} ${
                page === totalPages ? styles.pageBtnDisabled : ""
              }`}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

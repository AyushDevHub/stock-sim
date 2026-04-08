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

function SkeletonRows() {
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i}>
      <td colSpan={6}>
        <div
          className={styles.skelRow}
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <div className={styles.skelBar} style={{ width: 70 }} />
          <div className={styles.skelBar} style={{ width: 50 }} />
          <div className={styles.skelBar} style={{ width: 90 }} />
          <div
            className={styles.skelBar}
            style={{ width: 50, marginLeft: "auto" }}
          />
          <div className={styles.skelBar} style={{ width: 80 }} />
        </div>
      </td>
    </tr>
  ));
}

export default function OrderHistory({ orders, loading }) {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(orders.length / PAGE_SIZE);
  const paged = orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // unique symbol → color index map
  const symbolColorMap = {};
  orders.forEach((o, i) => {
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
              <th className={styles.thRight}>TYPE</th>
              <th className={styles.thRight}>QTY</th>
              <th className={styles.thRight}>PRICE</th>
              <th className={styles.thRight}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows />
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6}>
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
                        <div>
                          <div className={styles.stockSymbol}>{o.stock}</div>
                        </div>
                      </div>
                    </td>
                    <td className={styles.tdType}>
                      <span
                        className={`${styles.typePill} ${
                          o.type === "buy" ? styles.buyPill : styles.sellPill
                        }`}
                      >
                        {o.type.toUpperCase()}
                      </span>
                    </td>
                    <td className={styles.tdNum}>{o.quantity}</td>
                    <td className={styles.tdNum}>
                      ₹
                      {(o.price ?? 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className={styles.tdTotal}>
                      ₹
                      {(o.total ?? 0).toLocaleString("en-IN", {
                        maximumFractionDigits: 0,
                      })}
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

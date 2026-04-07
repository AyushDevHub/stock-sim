import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./StockTable.module.css";

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

const PAGE_SIZE = 12;

// Individual row with flash animation
function Row({ stock, idx }) {
  const ref = useRef(null);
  const prevDir = useRef("flat");
  const navigate = useNavigate();
  const up = (stock.change ?? 0) >= 0;

  useEffect(() => {
    if (!ref.current || stock.direction === "flat") return;
    if (stock.direction === prevDir.current) return;
    prevDir.current = stock.direction;
    ref.current.classList.remove("flash-up", "flash-down");
    void ref.current.offsetWidth;
    ref.current.classList.add(
      stock.direction === "up" ? "flash-up" : "flash-down"
    );
  }, [stock.price, stock.direction]);

  return (
    <tr
      ref={ref}
      className={styles.trow}
      onClick={() => navigate(`/chart?symbol=${stock.symbol}`)}
    >
      <td className={styles.tdStock}>
        <div className={styles.stockMeta}>
          <div
            className={styles.stockLogo}
            style={{
              background: `linear-gradient(135deg,${
                COLORS[idx % COLORS.length]
              },${COLORS[idx % COLORS.length]}88)`,
            }}
          >
            {stock.symbol.slice(0, 2)}
          </div>
          <div>
            <div className={styles.stockSymbol}>{stock.symbol}</div>
            <div className={styles.stockName}>{stock.name}</div>
          </div>
        </div>
      </td>
      <td className={styles.tdDate}>
        {new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </td>
      <td className={styles.tdNum}>
        {stock.volume ? (stock.volume / 1_00_000).toFixed(2) + "L" : "—"}
      </td>
      <td className={styles.tdChange}>
        <span
          className={`${styles.changePill} ${
            up ? styles.upPill : styles.downPill
          }`}
        >
          {up ? "▲" : "▼"} {up ? "+" : ""}
          {(stock.percentChange ?? 0).toFixed(2)}%
        </span>
      </td>
      <td className={styles.tdNum}>
        ₹
        {(stock.price ?? 0).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </td>
      <td className={styles.tdAction}>
        <button
          className={styles.actionBtn}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/trade`);
          }}
        >
          TRADE
        </button>
      </td>
    </tr>
  );
}

export default function StockTable({ stocks = [], loading }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: "symbol", dir: 1 });

  const filtered = stocks
    .filter(
      (s) =>
        !query ||
        s.symbol.includes(query.toUpperCase()) ||
        s.name?.toUpperCase().includes(query.toUpperCase())
    )
    .sort((a, b) => {
      const av = sort.key === "symbol" ? a.symbol : a[sort.key] ?? 0;
      const bv = sort.key === "symbol" ? b.symbol : b[sort.key] ?? 0;
      return av < bv ? -sort.dir : av > bv ? sort.dir : 0;
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key) => {
    setSort((s) => ({ key, dir: s.key === key ? -s.dir : 1 }));
    setPage(1);
  };

  const sortIcon = (key) =>
    sort.key === key ? (sort.dir > 0 ? " ↑" : " ↓") : " ↕";

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div className={styles.title}>Market Stocks</div>
          <span className={styles.count}>{filtered.length} stocks</span>
        </div>
        <div className={styles.actions}>
          <div className={styles.searchBar}>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4a6370"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              className={styles.searchInput}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search stock..."
            />
          </div>
          <button className={styles.filterBtn}>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="10" y1="18" x2="14" y2="18" />
            </svg>
            Filter
          </button>
        </div>
      </div>

      <div className={styles.wrap}>
        <div className={styles.scrollX}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th
                  className={styles.thLeft}
                  onClick={() => toggleSort("symbol")}
                >
                  NAME STOCK{sortIcon("symbol")}
                </th>
                <th className={styles.thLeft}>TRADE DATE</th>
                <th
                  className={styles.thRight}
                  onClick={() => toggleSort("volume")}
                >
                  VOLUME{sortIcon("volume")}
                </th>
                <th
                  className={styles.thRight}
                  onClick={() => toggleSort("percentChange")}
                >
                  CHANGE{sortIcon("percentChange")}
                </th>
                <th
                  className={styles.thRight}
                  onClick={() => toggleSort("price")}
                >
                  PRICE/STOCK{sortIcon("price")}
                </th>
                <th className={styles.thRight}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className={styles.trow}>
                    <td colSpan={6}>
                      <div className={styles.skelRow}>
                        <div
                          className={styles.skelBar}
                          style={{ width: 32, height: 32, borderRadius: "50%" }}
                        />
                        <div className={styles.skelBar} style={{ width: 80 }} />
                        <div
                          className={styles.skelBar}
                          style={{ width: 120 }}
                        />
                        <div
                          className={styles.skelBar}
                          style={{ width: 60, marginLeft: "auto" }}
                        />
                        <div className={styles.skelBar} style={{ width: 80 }} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>
                    No stocks match "{query}"
                  </td>
                </tr>
              ) : (
                paged.map((s, i) => (
                  <Row
                    key={s.symbol}
                    stock={s}
                    idx={(page - 1) * PAGE_SIZE + i}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && totalPages > 1 && (
          <div className={styles.pagination}>
            <div className={styles.pageInfo}>
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </div>
            <div className={styles.pageButtons}>
              <button
                className={styles.pageBtn}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ‹
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    className={`${styles.pageBtn} ${
                      page === p ? styles.pageBtnActive : ""
                    }`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                );
              })}
              {totalPages > 5 && (
                <span className={styles.pageBtn} style={{ cursor: "default" }}>
                  …
                </span>
              )}
              <button
                className={styles.pageBtn}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

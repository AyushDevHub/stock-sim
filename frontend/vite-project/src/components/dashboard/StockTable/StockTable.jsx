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
const PAGE_SIZE = 15;

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
    <>
      {/* ── Desktop row (table) ── */}
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
              <div className={styles.stockName}>
                {stock.name?.split(" ").slice(0, 3).join(" ")}
              </div>
            </div>
          </div>
        </td>
        <td className={styles.tdNum}>
          {stock.volume ? (stock.volume / 1_00_000).toFixed(2) + "L" : "—"}
        </td>
        <td className={styles.tdNum}>
          {stock.open
            ? `₹${stock.open.toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}`
            : "—"}
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
        <td className={styles.tdPrice}>
          ₹
          {(stock.price ?? 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </td>
        <td className={styles.tdAction}>
          <button
            className={styles.tradeBtn}
            onClick={(e) => {
              e.stopPropagation();
              navigate("/trade");
            }}
          >
            Trade
          </button>
        </td>
      </tr>

      {/* ── Mobile card (hidden on desktop via CSS) ── */}
      <tr className={styles.mobileCard}>
        <td colSpan={6}>
          <div
            className={styles.mCard}
            onClick={() => navigate(`/chart?symbol=${stock.symbol}`)}
          >
            <div className={styles.mCardLeft}>
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
                <div className={styles.stockName}>
                  {stock.name?.split(" ").slice(0, 2).join(" ")}
                </div>
              </div>
            </div>
            <div className={styles.mCardRight}>
              <div className={styles.mPrice}>
                ₹
                {(stock.price ?? 0).toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}
              </div>
              <div
                className={`${styles.mChange} ${up ? styles.up : styles.down}`}
              >
                {up ? "▲" : "▼"} {Math.abs(stock.percentChange ?? 0).toFixed(2)}
                %
              </div>
            </div>
            <button
              className={styles.tradeBtn}
              onClick={(e) => {
                e.stopPropagation();
                navigate("/trade");
              }}
            >
              Trade
            </button>
          </div>
        </td>
      </tr>
    </>
  );
}

export default function StockTable({ stocks = [], loading }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: "percentChange", dir: -1 });

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
    setSort((s) => ({ key, dir: s.key === key ? -s.dir : -1 }));
    setPage(1);
  };
  const sortIcon = (key) =>
    sort.key === key ? (sort.dir > 0 ? " ↑" : " ↓") : "";

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div className={styles.title}>All Stocks</div>
          <span className={styles.count}>{filtered.length} stocks</span>
        </div>
        <div className={styles.searchBar}>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#5a7080"
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
            placeholder="Search stock…"
          />
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th
                className={styles.thLeft}
                onClick={() => toggleSort("symbol")}
              >
                Company {sortIcon("symbol")}
              </th>
              <th
                className={styles.thRight}
                onClick={() => toggleSort("volume")}
              >
                Volume {sortIcon("volume")}
              </th>
              <th className={styles.thRight}>Open</th>
              <th
                className={styles.thRight}
                onClick={() => toggleSort("percentChange")}
              >
                Change {sortIcon("percentChange")}
              </th>
              <th
                className={styles.thRight}
                onClick={() => toggleSort("price")}
              >
                Price {sortIcon("price")}
              </th>
              <th className={styles.thRight}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className={styles.skelRow}>
                  <td colSpan={6}>
                    <div className={styles.skelInner}>
                      <div className={styles.skelCircle} />
                      <div className={styles.skelBar} style={{ width: 80 }} />
                      <div
                        className={styles.skelBar}
                        style={{ width: 120, marginLeft: "auto" }}
                      />
                      <div className={styles.skelBar} style={{ width: 70 }} />
                      <div className={styles.skelBar} style={{ width: 90 }} />
                    </div>
                  </td>
                </tr>
              ))
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.empty}>
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
          <span className={styles.pageInfo}>
            {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className={styles.pageButtons}>
            <button
              className={styles.pageBtn}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ‹
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
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
            {totalPages > 7 && <span className={styles.pageBtn}>…</span>}
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
  );
}

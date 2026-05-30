import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWatchlist } from "../../../hooks/useWatchlist.js";
import api from "../../../services/api.js";
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

export default function WatchlistCard({ stocks = [], loading: pricesLoading }) {
  const navigate = useNavigate();
  const { symbols, loading, add, remove, adding } = useWatchlist();

  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addingSyms, setAddingSyms] = useState(new Set());

  const watchlist = symbols
    .map((sym) => stocks.find((s) => s.symbol === sym))
    .filter(Boolean);

  const display =
    watchlist.length > 0
      ? watchlist
      : [...stocks]
          .sort(
            (a, b) =>
              Math.abs(b.percentChange ?? 0) - Math.abs(a.percentChange ?? 0)
          )
          .slice(0, 8);

  const handleSearch = async (q) => {
    setSearch(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data } = await api.get(
        `/stocks/search?q=${encodeURIComponent(q)}`
      );
      setResults(data.results?.slice(0, 6) || []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (symbol) => {
    if (addingSyms.has(symbol)) return;
    setAddingSyms((prev) => new Set(prev).add(symbol));
    try {
      // Register in DB first (no-op if already there)
      await api.post("/stocks/add", { symbol }).catch(() => {});
      await add(symbol);
    } finally {
      setAddingSyms((prev) => {
        const n = new Set(prev);
        n.delete(symbol);
        return n;
      });
    }
    setShowAdd(false);
    setSearch("");
    setResults([]);
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.title}>Watchlist</div>
        <button className={styles.addBtn} onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? "✕" : "+ Add"}
        </button>
      </div>

      {showAdd && (
        <div className={styles.addPanel}>
          <input
            className={styles.addInput}
            placeholder="Search any NSE/BSE symbol…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
          />
          {searching && <div className={styles.hint}>Searching…</div>}
          {!search && !searching && (
            <div className={styles.hint}>
              Type to search any stock — RELIANCE, TCS, ZOMATO…
            </div>
          )}
          {results.map((r) => (
            <button
              key={r.symbol}
              className={styles.result}
              onClick={() => handleAdd(r.symbol)}
              disabled={
                adding || addingSyms.has(r.symbol) || symbols.includes(r.symbol)
              }
            >
              <div>
                <div className={styles.rSym}>{r.symbol}</div>
                <div className={styles.rName}>{r.shortname || r.longname}</div>
              </div>
              {symbols.includes(r.symbol) ? (
                <span className={styles.addedTag}>✓ Added</span>
              ) : addingSyms.has(r.symbol) ? (
                <span className={styles.addingTag}>Adding…</span>
              ) : (
                <span className={styles.addTag}>+ Add</span>
              )}
            </button>
          ))}
          {/* Quick-add chips from live prices */}
          {!search &&
            stocks.slice(0, 8).map((s) => (
              <button
                key={s.symbol}
                className={styles.chip}
                onClick={() => handleAdd(s.symbol)}
                disabled={symbols.includes(s.symbol)}
              >
                {symbols.includes(s.symbol) ? "✓ " : ""}
                {s.symbol}
              </button>
            ))}
        </div>
      )}

      <div className={styles.list}>
        {(loading || pricesLoading) && symbols.length === 0
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.skel} />
            ))
          : display.map((s, i) => {
              const up = (s.change ?? 0) >= 0;
              const inList = symbols.includes(s.symbol);
              return (
                <div key={s.symbol} className={styles.item}>
                  <div
                    className={styles.itemMain}
                    onClick={() => navigate(`/chart?symbol=${s.symbol}`)}
                  >
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
                    <div className={styles.info}>
                      <div className={styles.sym}>{s.symbol}</div>
                      <div className={styles.name}>
                        {s.name?.split(" ").slice(0, 2).join(" ")}
                      </div>
                    </div>
                    <div className={styles.right}>
                      <div className={styles.price}>
                        ₹
                        {(s.price ?? 0).toLocaleString("en-IN", {
                          maximumFractionDigits: 0,
                        })}
                      </div>
                      <div
                        className={`${styles.chg} ${
                          up ? styles.up : styles.down
                        }`}
                      >
                        {up ? "▲" : "▼"}{" "}
                        {Math.abs(s.percentChange ?? 0).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  {inList && (
                    <button
                      className={styles.removeBtn}
                      onClick={() => remove(s.symbol)}
                      title="Remove"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
      </div>
    </div>
  );
}
